import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronLeft, CircleHelp, ClipboardList, Earth } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from '@/hooks/use-app-store';
import {
  buildChoices,
  Country,
  formatRegion,
  getCountriesByRegion,
  getFlagSource,
  Region,
  regions,
  shuffle,
} from '@/lib/countries';

type QuizMode = 'normal' | 'score' | 'review';
type QuizPhase = 'setup' | 'question' | 'result';
type QuizOrder = 'random' | 'unanswered' | 'wrong' | 'weak';

const questionCountByMode: Record<QuizMode, number> = {
  normal: 20,
  score: 30,
  review: 20,
};

const normalQuestionCounts = [10, 20, 30, 40, 50] as const;

const quizOrderOptions: { label: string; value: QuizOrder }[] = [
  { label: '完全ランダム', value: 'random' },
  { label: '未回答優先', value: 'unanswered' },
  { label: '間違えた国優先', value: 'wrong' },
  { label: '苦手国優先', value: 'weak' },
];

export default function QuizScreen() {
  const params = useLocalSearchParams<{ mode?: QuizMode }>();
  const store = useAppStore();
  const initialMode = params.mode === 'score' || params.mode === 'review' ? params.mode : 'normal';
  const [mode, setMode] = useState<QuizMode>(initialMode);
  const [region, setRegion] = useState<Region>('World');
  const [phase, setPhase] = useState<QuizPhase>('setup');
  const [questions, setQuestions] = useState<Country[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<{ country: Country; correct: boolean }[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isBest, setIsBest] = useState(false);
  const [quizOrder, setQuizOrder] = useState<QuizOrder>('random');
  const [normalQuestionCountIndex, setNormalQuestionCountIndex] = useState(2);
  const [isQuestionCountOpen, setIsQuestionCountOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isNormalSetup = phase === 'setup' && mode === 'normal';
  const isCompactSetup = height < 820;

  const current = questions[index];
  const pool = getCountriesByRegion(region);
  const choices = useMemo(
    () => (current ? buildChoices(current, getCountriesByRegion(region)) : []),
    [current, region]
  );
  const correctCount = answers.filter((answer) => answer.correct).length;
  const wrongAnswers = answers.filter((answer) => !answer.correct);
  const score = Math.max(0, correctCount * 1000 + Math.max(0, 10000 - elapsedSeconds * 100));

  function startQuiz() {
    const source =
      mode === 'review'
        ? pool.filter((country) => (store.stats[country.id]?.wrongCount ?? 0) > 0)
        : pool;
    const fallback = source.length >= 4 ? source : pool;
    const orderedSource = mode === 'normal' ? getOrderedCountries(fallback, quizOrder, store.stats) : fallback;
    const questionCount = mode === 'normal' ? normalQuestionCounts[normalQuestionCountIndex] : questionCountByMode[mode];
    setQuestions(orderedSource.slice(0, Math.min(questionCount, orderedSource.length)));
    setIndex(0);
    setAnswers([]);
    setSelectedId(null);
    setStartedAt(getTimestamp());
    setElapsedSeconds(0);
    setIsBest(false);
    setIsQuestionCountOpen(false);
    setPhase('question');
  }

  function finishQuiz(nextAnswers: { country: Country; correct: boolean }[]) {
    const elapsed = startedAt ? Math.max(1, Math.round((getTimestamp() - startedAt) / 1000)) : 0;
    const correct = nextAnswers.filter((answer) => answer.correct).length;
    const finalScore =
      mode === 'score' ? Math.max(0, correct * 1000 + Math.max(0, 10000 - elapsed * 100)) : 0;
    setElapsedSeconds(elapsed);
    setIsBest(
      store.recordHistory({
        mode: mode === 'score' ? 'score' : 'normal',
        region,
        score: finalScore,
        correctCount: correct,
        totalQuestions: nextAnswers.length,
        elapsedSeconds: elapsed,
        playedAt: new Date().toISOString(),
      })
    );
    setPhase('result');
  }

  function answer(country: Country) {
    if (!current || selectedId !== null) {
      return;
    }
    const correct = country.id === current.id;
    const nextAnswers = [...answers, { country: current, correct }];
    setSelectedId(country.id);
    setAnswers(nextAnswers);
    store.recordAnswer(current, correct);

    if (mode === 'score') {
      setTimeout(() => {
        if (index + 1 >= questions.length) {
          finishQuiz(nextAnswers);
        } else {
          setIndex((value) => value + 1);
          setSelectedId(null);
        }
      }, 1000);
    }
  }

  function goNext() {
    if (index + 1 >= questions.length) {
      finishQuiz(answers);
    } else {
      setIndex((value) => value + 1);
      setSelectedId(null);
    }
  }

  if (phase === 'result') {
    const accuracy = answers.length ? Math.round((correctCount / answers.length) * 100) : 0;
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Stack.Screen options={{ headerShown: true, title: 'クイズ' }} />
        <View style={styles.card}>
          <Text style={styles.eyebrow}>{mode === 'score' ? 'スコアアタック結果' : 'クイズ結果'}</Text>
          {mode === 'score' && <Text style={styles.score}>{score.toLocaleString()}</Text>}
          {mode === 'score' && (
            <Text style={[styles.bestLabel, isBest && styles.bestLabelActive]}>
              {isBest ? '自己ベスト更新' : '自己ベスト更新なし'}
            </Text>
          )}
          <View style={styles.resultGrid}>
            <ResultStat label="正解" value={`${correctCount}問`} color="#12a150" />
            <ResultStat label="不正解" value={`${answers.length - correctCount}問`} color="#e23b3b" />
            <ResultStat label="正答率" value={`${accuracy}%`} color="#0077f6" />
            <ResultStat label="時間" value={`${elapsedSeconds}秒`} color="#5b5fef" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>間違えた国</Text>
          {wrongAnswers.length === 0 ? (
            <Text style={styles.mutedText}>全問正解です。</Text>
          ) : (
            wrongAnswers.map(({ country }) => (
              <View key={country.id} style={styles.wrongRow}>
                <Image source={getFlagSource(country)} style={styles.wrongFlag} contentFit="contain" />
                <Text style={styles.wrongName}>{country.nameJa}</Text>
                <Text style={styles.wrongRegion}>{formatRegion(country.region)}</Text>
              </View>
            ))
          )}
        </View>

        <PrimaryButton title="もう一度挑戦" onPress={startQuiz} />
        <SecondaryButton title="設定に戻る" onPress={() => setPhase('setup')} />
      </ScrollView>
    );
  }

  if (phase === 'question' && current) {
    const progress = (index + 1) / questions.length;
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Stack.Screen options={{ headerShown: true, title: 'クイズ' }} />
        <View style={styles.quizHeader}>
          <Text style={styles.questionCount}>
            問題 {index + 1} / {questions.length}
          </Text>
          <Text style={styles.questionRegion}>{formatRegion(region)}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: progress }]} />
          <View style={{ flex: 1 - progress }} />
        </View>

        <View style={styles.flagCard}>
          <Image
            source={getFlagSource(current)}
            style={styles.flagImage}
            contentFit="contain"
            accessibilityLabel="出題中の国旗"
          />
        </View>
        <Text style={styles.prompt}>この国の名前は？</Text>

        <View style={styles.choiceList}>
          {choices.map((country, choiceIndex) => {
            const answered = selectedId !== null;
            const isCorrect = country.id === current.id;
            const isSelected = selectedId === country.id;
            return (
              <Pressable
                key={country.id}
                disabled={answered}
                onPress={() => answer(country)}
                style={[
                  styles.choice,
                  answered && isCorrect && styles.choiceCorrect,
                  answered && isSelected && !isCorrect && styles.choiceWrong,
                ]}>
                <Text style={styles.choiceNumber}>{choiceIndex + 1}</Text>
                <Text style={styles.choiceText}>{country.nameJa}</Text>
              </Pressable>
            );
          })}
        </View>

        {mode !== 'score' && (
          <PrimaryButton
            title={selectedId === null ? '回答を選択してください' : '次の問題へ'}
            disabled={selectedId === null}
            onPress={goNext}
          />
        )}
        <SecondaryButton title="中断" onPress={() => setPhase('setup')} />
      </ScrollView>
    );
  }

  if (isNormalSetup) {
    return (
      <View style={styles.setupScreen}>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={[
            styles.setupContent,
            {
              paddingTop: insets.top + (isCompactSetup ? 2 : 4),
              paddingBottom: insets.bottom + (isCompactSetup ? 8 : 12),
              gap: isCompactSetup ? 10 : 14,
            },
          ]}>
          <View style={[styles.setupHeader, isCompactSetup && styles.setupHeaderCompact]}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              hitSlop={12}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="戻る">
              <ChevronLeft color="#0b6ff6" size={isCompactSetup ? 22 : 26} strokeWidth={3} />
            </Pressable>
            <Text style={[styles.setupTitle, isCompactSetup && styles.setupTitleCompact]}>出題設定</Text>
            <View style={styles.headerSpacer} />
          </View>

          <SetupCard style={styles.regionSetupCard} compact={isCompactSetup}>
            <SetupSectionHeader icon="region" title="出題地域" compact={isCompactSetup} />
            <View style={styles.regionTable}>
              <RegionOption
                label="全世界"
                selected={region === 'World'}
                onPress={() => setRegion('World')}
                fullWidth
                compact={isCompactSetup}
              />
              <View style={styles.regionGrid}>
                {regions
                  .filter((regionValue) => regionValue !== 'World')
                  .map((regionValue, regionIndex) => (
                    <RegionOption
                      key={regionValue}
                      label={formatRegion(regionValue)}
                      selected={region === regionValue}
                      onPress={() => setRegion(regionValue)}
                      compact={isCompactSetup}
                      gridIndex={regionIndex}
                    />
                  ))}
              </View>
            </View>
          </SetupCard>

          <SetupCard style={styles.orderSetupCard} compact={isCompactSetup}>
            <SetupSectionHeader icon="order" title="出題方法" compact={isCompactSetup} />
            <View style={styles.orderTable}>
              {quizOrderOptions.map((option, optionIndex) => (
                <OrderOption
                  key={option.value}
                  label={option.label}
                  selected={quizOrder === option.value}
                  onPress={() => setQuizOrder(option.value)}
                  compact={isCompactSetup}
                  showDivider={optionIndex < quizOrderOptions.length - 1}
                />
              ))}
            </View>
          </SetupCard>

          <SetupCard style={styles.countSetupCard} compact={isCompactSetup}>
            <SetupSectionHeader icon="count" title="問題数" compact={isCompactSetup} />
            <View style={styles.countDropdownWrapper}>
              {isQuestionCountOpen && (
                <View style={[styles.countDropdownMenu, isCompactSetup && styles.countDropdownMenuCompact]}>
                  {normalQuestionCounts.map((count, countIndex) => (
                    <Pressable
                      key={count}
                      onPress={() => {
                        setNormalQuestionCountIndex(countIndex);
                        setIsQuestionCountOpen(false);
                      }}
                      style={[
                        styles.countDropdownOption,
                        countIndex === normalQuestionCountIndex && styles.countDropdownOptionSelected,
                        countIndex < normalQuestionCounts.length - 1 && styles.countDropdownOptionDivider,
                        isCompactSetup && styles.countDropdownOptionCompact,
                      ]}>
                      <Text style={[styles.countSelectText, isCompactSetup && styles.countSelectTextCompact]}>
                        {count}問
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
              <Pressable
                onPress={() => setIsQuestionCountOpen((value) => !value)}
                style={[styles.countSelect, isCompactSetup && styles.countSelectCompact]}
                accessibilityRole="button"
                accessibilityState={{ expanded: isQuestionCountOpen }}>
                <Text style={[styles.countSelectText, isCompactSetup && styles.countSelectTextCompact]}>
                  {normalQuestionCounts[normalQuestionCountIndex]}問
                </Text>
                <ChevronDown color="#0b6ff6" size={isCompactSetup ? 18 : 20} strokeWidth={3} />
              </Pressable>
            </View>
          </SetupCard>

          <PrimaryButton title="クイズ開始" onPress={startQuiz} textStyle={styles.quizStartButtonText} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerShown: true, title: 'クイズ' }} />
      <View style={styles.card}>
        <Text style={styles.title}>クイズ設定</Text>
        <Text style={styles.description}>地域とモードを選んで、国旗4択クイズを始めます。</Text>

        <Text style={styles.sectionTitle}>モード</Text>
        <View style={styles.segmentGrid}>
          <SegmentButton active={mode === 'normal'} title="通常" onPress={() => setMode('normal')} />
          <SegmentButton active={mode === 'score'} title="スコア" onPress={() => setMode('score')} />
          <SegmentButton active={mode === 'review'} title="苦手復習" onPress={() => setMode('review')} />
        </View>

        <Text style={styles.sectionTitle}>出題範囲</Text>
        <View style={styles.chipGrid}>
          {regions.map((regionValue) => (
            <SegmentButton
              key={regionValue}
              active={region === regionValue}
              title={formatRegion(regionValue)}
              onPress={() => setRegion(regionValue)}
            />
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>ルール</Text>
        <Text style={styles.description}>
          {mode === 'score'
            ? '30問固定です。回答後は1秒で次の問題へ進み、正解数と速度でスコアを計算します。'
            : '1問ずつ回答し、正誤を確認しながら次の問題へ進みます。'}
        </Text>
      </View>

      <PrimaryButton title="スタート" onPress={startQuiz} />
    </ScrollView>
  );
}

function SetupCard({
  children,
  compact,
  style,
}: {
  children: React.ReactNode;
  compact: boolean;
  style: object;
}) {
  return <View style={[styles.setupCard, compact && styles.setupCardCompact, style]}>{children}</View>;
}

function SetupSectionHeader({
  compact,
  icon,
  title,
}: {
  compact: boolean;
  icon: 'region' | 'order' | 'count';
  title: string;
}) {
  const iconSize = compact ? 18 : 21;
  const iconProps = { color: '#ffffff', size: iconSize, strokeWidth: 2.9 };
  return (
    <View style={styles.setupSectionHeader}>
      <View style={[styles.setupIconBadge, compact && styles.setupIconBadgeCompact]}>
        {icon === 'region' && <Earth {...iconProps} />}
        {icon === 'order' && <CircleHelp {...iconProps} />}
        {icon === 'count' && <ClipboardList {...iconProps} />}
      </View>
      <Text style={[styles.setupSectionTitle, compact && styles.setupSectionTitleCompact]}>{title}</Text>
    </View>
  );
}

function RegionOption({
  compact,
  fullWidth,
  gridIndex,
  label,
  onPress,
  selected,
}: {
  compact: boolean;
  fullWidth?: boolean;
  gridIndex?: number;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const isRightColumn = gridIndex !== undefined && gridIndex % 2 === 1;
  const isTopRows = gridIndex !== undefined && gridIndex < 4;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.regionOption,
        fullWidth ? styles.regionOptionFull : styles.regionOptionHalf,
        isRightColumn && styles.regionOptionRightColumn,
        isTopRows && styles.regionOptionTopRows,
        selected && styles.setupOptionSelected,
        compact && styles.regionOptionCompact,
      ]}>
      <View style={[styles.radioOuter, compact && styles.radioOuterCompact, selected && styles.radioOuterSelected]}>
        {selected && <View style={[styles.radioInner, compact && styles.radioInnerCompact]} />}
      </View>
      <Text style={[styles.setupOptionText, compact && styles.setupOptionTextCompact]}>{label}</Text>
    </Pressable>
  );
}

function OrderOption({
  compact,
  label,
  onPress,
  selected,
  showDivider,
}: {
  compact: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
  showDivider: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.orderOption,
        selected && styles.setupOptionSelected,
        showDivider && styles.orderOptionDivider,
        compact && styles.orderOptionCompact,
      ]}>
      <View style={[styles.radioOuter, compact && styles.radioOuterCompact, selected && styles.radioOuterSelected]}>
        {selected && <View style={[styles.radioInner, compact && styles.radioInnerCompact]} />}
      </View>
      <Text style={[styles.setupOptionText, compact && styles.setupOptionTextCompact]}>{label}</Text>
    </Pressable>
  );
}

function SegmentButton({
  active,
  onPress,
  title,
}: {
  active: boolean;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentButton, active && styles.segmentButtonActive]}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{title}</Text>
    </Pressable>
  );
}

function ResultStat({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={[styles.resultStat, { borderColor: color }]}>
      <Text style={[styles.resultValue, { color }]}>{value}</Text>
      <Text style={styles.resultLabel}>{label}</Text>
    </View>
  );
}

function PrimaryButton({
  disabled,
  onPress,
  textStyle,
  title,
}: {
  disabled?: boolean;
  onPress: () => void;
  textStyle?: object;
  title: string;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled && styles.disabledButton]}>
      <Text style={[styles.primaryButtonText, textStyle]}>{title}</Text>
    </Pressable>
  );
}

function SecondaryButton({ onPress, title }: { onPress: () => void; title: string }) {
  return (
    <Pressable onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>{title}</Text>
    </Pressable>
  );
}

function getOrderedCountries(
  source: Country[],
  order: QuizOrder,
  stats: Record<number, { answerCount: number; correctCount: number; wrongCount: number; lastAnsweredAt?: string }>
) {
  const randomized = shuffle(source);

  if (order === 'random') {
    return randomized;
  }

  return randomized.sort((a, b) => {
    const aStats = stats[a.id];
    const bStats = stats[b.id];

    if (order === 'unanswered') {
      return Number(Boolean(aStats?.answerCount)) - Number(Boolean(bStats?.answerCount));
    }

    if (order === 'wrong') {
      return (bStats?.wrongCount ?? 0) - (aStats?.wrongCount ?? 0);
    }

    const aWeakScore = getWeakScore(aStats);
    const bWeakScore = getWeakScore(bStats);
    return bWeakScore - aWeakScore;
  });
}

function getWeakScore(stats?: { answerCount: number; wrongCount: number }) {
  if (!stats?.answerCount) {
    return 0;
  }

  return stats.wrongCount / stats.answerCount;
}

const styles = StyleSheet.create({
  setupScreen: {
    flex: 1,
    backgroundColor: '#f6fbff',
  },
  setupContent: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    paddingHorizontal: 18,
  },
  setupHeader: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
  },
  setupHeaderCompact: {
    minHeight: 32,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  setupTitle: {
    flex: 1,
    color: '#071939',
    fontSize: 21,
    lineHeight: 26,
    textAlign: 'center',
    letterSpacing: 0,
  },
  setupTitleCompact: {
    fontSize: 19,
    lineHeight: 24,
  },
  headerSpacer: {
    width: 32,
  },
  setupCard: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#dce5f0',
    backgroundColor: '#ffffff',
    gap: 10,
  },
  setupCardCompact: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  regionSetupCard: {
    flex: 1.2,
  },
  orderSetupCard: {
    flex: 1,
  },
  countSetupCard: {
    flex: 0.55,
    paddingBottom: 8,
    zIndex: 3,
  },
  setupSectionHeader: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  setupIconBadge: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#1475f8',
  },
  setupIconBadgeCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  setupSectionTitle: {
    flex: 1,
    color: '#071939',
    fontSize: 18,
    lineHeight: 24,
  },
  setupSectionTitleCompact: {
    fontSize: 16,
    lineHeight: 21,
  },
  regionTable: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#d9e1ec',
  },
  regionGrid: {
    flex: 3,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  regionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderColor: '#d9e1ec',
    backgroundColor: '#ffffff',
  },
  regionOptionCompact: {
    gap: 10,
    paddingHorizontal: 12,
  },
  regionOptionFull: {
    flex: 1,
    width: '100%',
    borderBottomWidth: 1,
  },
  regionOptionHalf: {
    width: '50%',
    height: '33.333%',
  },
  regionOptionRightColumn: {
    borderLeftWidth: 1,
  },
  regionOptionTopRows: {
    borderBottomWidth: 1,
  },
  setupOptionText: {
    flexShrink: 1,
    color: '#071939',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  setupOptionTextCompact: {
    fontSize: 14,
    lineHeight: 19,
  },
  setupOptionSelected: {
    backgroundColor: '#edf6ff',
  },
  orderTable: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#d9e1ec',
  },
  orderOption: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderColor: '#d9e1ec',
    backgroundColor: '#ffffff',
  },
  orderOptionDivider: {
    borderBottomWidth: 1,
  },
  orderOptionCompact: {
    gap: 10,
    paddingHorizontal: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#9aa5b5',
  },
  radioOuterCompact: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  radioOuterSelected: {
    borderColor: '#1475f8',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1475f8',
  },
  radioInnerCompact: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  countDropdownWrapper: {
    position: 'relative',
    zIndex: 4,
  },
  countDropdownMenu: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 46,
    overflow: 'hidden',
    borderRadius: 8,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#aeb8c7',
    backgroundColor: '#ffffff',
    boxShadow: '0 8px 18px rgba(7, 25, 57, 0.14)',
    zIndex: 5,
  },
  countDropdownMenuCompact: {
    bottom: 40,
  },
  countDropdownOption: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  countDropdownOptionCompact: {
    minHeight: 40,
    paddingHorizontal: 10,
  },
  countDropdownOptionSelected: {
    backgroundColor: '#edf6ff',
  },
  countDropdownOptionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#d9e1ec',
  },
  countSelect: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#aeb8c7',
    backgroundColor: '#ffffff',
  },
  countSelectCompact: {
    minHeight: 36,
    paddingHorizontal: 10,
  },
  countSelectText: {
    color: '#071939',
    fontSize: 19,
    lineHeight: 25,
  },
  countSelectTextCompact: {
    fontSize: 16,
    lineHeight: 22,
  },
  countNote: {
    color: '#6e7a8d',
    fontSize: 14,
    lineHeight: 20,
  },
  countNoteCompact: {
    fontSize: 12,
    lineHeight: 17,
  },
  screen: {
    flex: 1,
    backgroundColor: '#f5f9ff',
  },
  content: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    gap: 18,
    padding: 20,
    paddingBottom: 32,
  },
  card: {
    gap: 16,
    padding: 20,
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: '#ffffff',
    boxShadow: '0 8px 22px rgba(0, 51, 102, 0.09)',
  },
  title: {
    color: '#08275a',
    fontSize: 34,
    lineHeight: 40,
  },
  description: {
    color: '#50627f',
    fontSize: 15,
    lineHeight: 23,
  },
  sectionTitle: {
    color: '#08275a',
    fontSize: 20,
  },
  segmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  segmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#edf4ff',
    borderWidth: 1,
    borderColor: '#d5e4f8',
  },
  segmentButtonActive: {
    backgroundColor: '#0077f6',
    borderColor: '#0077f6',
  },
  segmentText: {
    color: '#08275a',
    fontSize: 15,
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionCount: {
    color: '#0067e8',
    fontSize: 27,
  },
  questionRegion: {
    color: '#0067e8',
    fontSize: 23,
  },
  progressTrack: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#d8e4f6',
  },
  progressFill: {
    backgroundColor: '#0077f6',
  },
  flagCard: {
    height: 250,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cfe0f6',
    backgroundColor: '#ffffff',
  },
  flagImage: {
    width: '100%',
    height: '100%',
  },
  prompt: {
    color: '#08275a',
    fontSize: 30,
    lineHeight: 38,
    textAlign: 'center',
  },
  choiceList: {
    gap: 12,
  },
  choice: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d5e4f8',
    backgroundColor: '#ffffff',
  },
  choiceCorrect: {
    borderColor: '#12a150',
    backgroundColor: '#eefaf3',
  },
  choiceWrong: {
    borderColor: '#e23b3b',
    backgroundColor: '#fff0f0',
  },
  choiceNumber: {
    color: '#08275a',
    fontSize: 24,
  },
  choiceText: {
    flex: 1,
    color: '#08275a',
    fontSize: 24,
  },
  primaryButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#0077f6',
  },
  disabledButton: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
  },
  quizStartButtonText: {
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#eaf3ff',
  },
  secondaryButtonText: {
    color: '#0067e8',
    fontSize: 18,
  },
  eyebrow: {
    color: '#50627f',
    fontSize: 16,
  },
  score: {
    color: '#0067e8',
    fontSize: 52,
    lineHeight: 60,
  },
  bestLabel: {
    color: '#50627f',
    fontSize: 16,
  },
  bestLabelActive: {
    color: '#12a150',
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  resultStat: {
    minWidth: 136,
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  resultValue: {
    fontSize: 26,
  },
  resultLabel: {
    color: '#50627f',
    fontSize: 14,
  },
  mutedText: {
    color: '#50627f',
    fontSize: 15,
  },
  wrongRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#f5f9ff',
  },
  wrongFlag: {
    width: 54,
    height: 36,
  },
  wrongName: {
    flex: 1,
    color: '#08275a',
    fontSize: 16,
  },
  wrongRegion: {
    color: '#50627f',
    fontSize: 13,
  },
});

function getTimestamp() {
  return Date.now();
}
