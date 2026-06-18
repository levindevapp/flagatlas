import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppStore } from '@/hooks/use-app-store';
import {
  countries,
  formatRegion,
  getFlagSource,
  quizCountries,
  Region,
  regions,
} from '@/lib/countries';

export default function RecordsScreen() {
  const { bestScore, histories, stats } = useAppStore();
  const allStats = Object.values(stats);
  const totalAnswers = allStats.reduce((sum, stat) => sum + stat.answerCount, 0);
  const totalCorrect = allStats.reduce((sum, stat) => sum + stat.correctCount, 0);
  const totalTime = histories.reduce((sum, history) => sum + history.elapsedSeconds, 0);
  const accuracy = totalAnswers ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

  const regionStats = regions
    .filter((region): region is Exclude<Region, 'World'> => region !== 'World')
    .map((region) => {
      const ids = quizCountries.filter((country) => country.region === region).map((country) => country.id);
      const regionAnswers = ids.reduce((sum, id) => sum + (stats[id]?.answerCount ?? 0), 0);
      const regionCorrect = ids.reduce((sum, id) => sum + (stats[id]?.correctCount ?? 0), 0);
      return {
        region,
        accuracy: regionAnswers ? Math.round((regionCorrect / regionAnswers) * 100) : 0,
      };
    });

  const weakCountries = allStats
    .filter((stat) => stat.wrongCount > 0)
    .map((stat) => ({
      country: countries.find((country) => country.id === stat.countryId),
      accuracy: stat.answerCount ? Math.round((stat.correctCount / stat.answerCount) * 100) : 0,
      wrongCount: stat.wrongCount,
    }))
    .filter((item): item is { country: (typeof countries)[number]; accuracy: number; wrongCount: number } =>
      Boolean(item.country)
    )
    .sort((a, b) => a.accuracy - b.accuracy || b.wrongCount - a.wrongCount)
    .slice(0, 5);

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 成績</Text>
        <Text style={styles.description}>あなたのクイズ成績を確認しましょう。</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>サマリー</Text>
        <View style={styles.summaryGrid}>
          <SummaryTile label="総プレイ数" value={`${histories.length}回`} color="#c56a19" />
          <SummaryTile label="平均正答率" value={`${accuracy}%`} color="#128a43" />
          <SummaryTile label="最高スコア" value={bestScore.toLocaleString()} color="#0067e8" />
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>総回答数</Text>
          <Text style={styles.metaValue}>{totalAnswers}問</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>総正解数</Text>
          <Text style={styles.metaValue}>{totalCorrect}問</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>総プレイ時間</Text>
          <Text style={styles.metaValue}>{totalTime}秒</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>地域別成績</Text>
        {regionStats.map(({ accuracy: regionAccuracy, region }) => (
          <View key={region} style={styles.regionRow}>
            <Text style={styles.regionName}>{formatRegion(region)}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.max(regionAccuracy, 4)}%` }]} />
            </View>
            <Text style={styles.regionRate}>{regionAccuracy}%</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>苦手な国 TOP5</Text>
        {weakCountries.length === 0 ? (
          <Text style={styles.emptyText}>まだ苦手国はありません。クイズに挑戦すると表示されます。</Text>
        ) : (
          weakCountries.map(({ accuracy: countryAccuracy, country }, index) => (
            <View key={country.id} style={styles.weakRow}>
              <Text style={styles.rank}>{index + 1}</Text>
              <Image source={getFlagSource(country)} style={styles.flag} contentFit="contain" />
              <Text style={styles.weakName}>{country.nameJa}</Text>
              <Text style={styles.weakRate}>正答率 {countryAccuracy}%</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>最近のプレイ履歴</Text>
        {histories.length === 0 ? (
          <Text style={styles.emptyText}>まだ履歴はありません。</Text>
        ) : (
          histories.slice(0, 5).map((history) => (
            <View key={history.playedAt} style={styles.historyRow}>
              <View>
                <Text style={styles.historyTitle}>
                  {history.mode === 'score' ? 'スコアアタック' : '通常クイズ'}
                </Text>
                <Text style={styles.historyMeta}>
                  {formatRegion(history.region)} / {history.correctCount}問正解
                </Text>
              </View>
              <Text style={styles.historyScore}>
                {history.mode === 'score' ? history.score.toLocaleString() : `${history.elapsedSeconds}秒`}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function SummaryTile({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={[styles.summaryTile, { borderColor: color }]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f9ff',
  },
  content: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    gap: 16,
    padding: 18,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
  },
  title: {
    color: '#08275a',
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
  },
  description: {
    color: '#50627f',
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    gap: 16,
    padding: 18,
    borderRadius: 22,
    borderCurve: 'continuous',
    backgroundColor: '#ffffff',
    boxShadow: '0 8px 22px rgba(0, 51, 102, 0.08)',
  },
  sectionTitle: {
    color: '#08275a',
    fontSize: 21,
    fontWeight: '900',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryTile: {
    minWidth: 145,
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  summaryValue: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#50627f',
    fontSize: 13,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e4edf8',
    paddingTop: 12,
  },
  metaLabel: {
    color: '#50627f',
    fontSize: 15,
    fontWeight: '800',
  },
  metaValue: {
    color: '#08275a',
    fontSize: 16,
    fontWeight: '900',
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  regionName: {
    width: 86,
    color: '#08275a',
    fontSize: 15,
    fontWeight: '900',
  },
  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#e8eef7',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#0077f6',
  },
  regionRate: {
    width: 46,
    color: '#0067e8',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
  },
  weakRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4edf8',
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#ffb800',
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  flag: {
    width: 54,
    height: 36,
  },
  weakName: {
    flex: 1,
    color: '#08275a',
    fontSize: 17,
    fontWeight: '900',
  },
  weakRate: {
    color: '#d93434',
    fontSize: 14,
    fontWeight: '900',
  },
  emptyText: {
    color: '#50627f',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e4edf8',
  },
  historyTitle: {
    color: '#08275a',
    fontSize: 16,
    fontWeight: '900',
  },
  historyMeta: {
    color: '#50627f',
    fontSize: 13,
    fontWeight: '700',
  },
  historyScore: {
    color: '#0067e8',
    fontSize: 18,
    fontWeight: '900',
  },
});
