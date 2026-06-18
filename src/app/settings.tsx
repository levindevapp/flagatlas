import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

export default function SettingsScreen() {
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(true);
  const [preferReview, setPreferReview] = useState(false);

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>設定</Text>
        <Text style={styles.description}>クイズの表示と学習補助を調整できます。</Text>
      </View>

      <View style={styles.card}>
        <SettingRow
          title="回答後の正誤表示"
          description="通常クイズで答え合わせを表示します。"
          value={showAnswerFeedback}
          onValueChange={setShowAnswerFeedback}
        />
        <SettingRow
          title="苦手国を優先"
          description="出題設定で苦手国を選びやすくします。"
          value={preferReview}
          onValueChange={setPreferReview}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>保存データ</Text>
        <Text style={styles.note}>成績、お気に入り、苦手国データはこの端末内に保存されます。</Text>
      </View>
    </ScrollView>
  );
}

function SettingRow({
  description,
  onValueChange,
  title,
  value,
}: {
  description: string;
  onValueChange: (value: boolean) => void;
  title: string;
  value: boolean;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
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
    maxWidth: 800,
    alignSelf: 'center',
    gap: 16,
    padding: 18,
    paddingBottom: 32,
  },
  header: {
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
    lineHeight: 22,
    fontWeight: '700',
  },
  card: {
    gap: 4,
    padding: 18,
    borderRadius: 22,
    borderCurve: 'continuous',
    backgroundColor: '#ffffff',
    boxShadow: '0 8px 22px rgba(0, 51, 102, 0.08)',
  },
  settingRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e4edf8',
  },
  settingText: {
    flex: 1,
    gap: 3,
  },
  settingTitle: {
    color: '#08275a',
    fontSize: 17,
    fontWeight: '900',
  },
  settingDescription: {
    color: '#50627f',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#08275a',
    fontSize: 20,
    fontWeight: '900',
  },
  note: {
    color: '#50627f',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
});
