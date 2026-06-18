import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/home-hero.png')}
            style={styles.heroImage}
            contentFit="cover"
            accessibilityLabel="FLAG ATLAS"
          />
        </View>

        <View style={styles.primaryGrid}>
          <HomeAction
            title="通常クイズ"
            description="世界の国旗を学ぼう"
            accent="#0077f6"
            icon="🌐"
            onPress={() => router.push('/quiz?mode=normal')}
          />
          <HomeAction
            title="スコアアタック"
            description="30問で最高点を狙おう"
            accent="#ff8a00"
            icon="🏆"
            onPress={() => router.push('/quiz?mode=score')}
          />
        </View>

        <View style={styles.secondaryGrid}>
          <SmallAction title="国旗一覧" icon="⚑" onPress={() => router.push('/flags')} />
          <SmallAction title="成績" icon="▮▮▮" onPress={() => router.push('/records')} />
          <SmallAction title="設定" icon="⚙" onPress={() => router.push('/settings')} />
        </View>
      </View>
    </ScrollView>
  );
}

function HomeAction({
  accent,
  description,
  icon,
  onPress,
  title,
}: {
  accent: string;
  description: string;
  icon: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.homeAction, { backgroundColor: accent }, pressed && styles.pressed]}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDescription}>{description}</Text>
      <View style={styles.circleArrow}>
        <Text style={[styles.arrow, { color: accent }]}>›</Text>
      </View>
    </Pressable>
  );
}

function SmallAction({
  icon,
  onPress,
  title,
}: {
  icon: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}>
      <Text style={styles.smallIcon}>{icon}</Text>
      <Text style={styles.smallTitle}>{title}</Text>
      <View style={styles.smallArrow}>
        <Text style={styles.smallArrowText}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f8ff',
  },
  content: {
    alignItems: 'center',
    paddingBottom: Spacing.four,
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  hero: {
    backgroundColor: '#008cff',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    aspectRatio: 853 / 744,
  },
  primaryGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  homeAction: {
    flex: 1,
    minHeight: 172,
    borderRadius: 24,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    justifyContent: 'center',
    gap: Spacing.one,
    borderCurve: 'continuous',
  },
  actionIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
  },
  actionDescription: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  circleArrow: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  arrow: {
    fontSize: 36,
    lineHeight: 36,
    fontWeight: '800',
  },
  secondaryGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  smallAction: {
    flex: 1,
    minHeight: 132,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderCurve: 'continuous',
    boxShadow: '0 8px 22px rgba(0, 51, 102, 0.10)',
  },
  smallIcon: {
    fontSize: 32,
    color: '#0068df',
    fontWeight: '800',
  },
  smallTitle: {
    color: '#0a2a5c',
    fontSize: 16,
    fontWeight: '800',
  },
  smallArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0077f6',
  },
  smallArrowText: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
});
