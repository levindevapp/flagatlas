import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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

const questionCountByMode: Record<QuizMode, number> = {
  normal: 20,
  score: 30,
  review: 20,
};

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
    setQuestions(shuffle(fallback).slice(0, questionCountByMode[mode]));
    setIndex(0);
    setAnswers([]);
    setSelectedId(null);
    setStartedAt(getTimestamp());
    setElapsedSeconds(0);
    setIsBest(false);
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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
  title,
}: {
  disabled?: boolean;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled && styles.disabledButton]}>
      <Text style={styles.primaryButtonText}>{title}</Text>
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

const styles = StyleSheet.create({
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
    fontWeight: '900',
  },
  description: {
    color: '#50627f',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#08275a',
    fontSize: 20,
    fontWeight: '900',
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
    fontWeight: '800',
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
    fontWeight: '900',
  },
  questionRegion: {
    color: '#0067e8',
    fontSize: 23,
    fontWeight: '900',
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
    fontWeight: '900',
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
    fontWeight: '900',
  },
  choiceText: {
    flex: 1,
    color: '#08275a',
    fontSize: 24,
    fontWeight: '900',
  },
  primaryButton: {
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#0077f6',
  },
  disabledButton: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
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
    fontWeight: '900',
  },
  eyebrow: {
    color: '#50627f',
    fontSize: 16,
    fontWeight: '800',
  },
  score: {
    color: '#0067e8',
    fontSize: 52,
    lineHeight: 60,
    fontWeight: '900',
  },
  bestLabel: {
    color: '#50627f',
    fontSize: 16,
    fontWeight: '800',
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
    fontWeight: '900',
  },
  resultLabel: {
    color: '#50627f',
    fontSize: 14,
    fontWeight: '700',
  },
  mutedText: {
    color: '#50627f',
    fontSize: 15,
    fontWeight: '600',
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
    fontWeight: '900',
  },
  wrongRegion: {
    color: '#50627f',
    fontSize: 13,
    fontWeight: '700',
  },
});

function getTimestamp() {
  return Date.now();
}
