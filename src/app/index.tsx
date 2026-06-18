import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

const homeIcons = {
  flagList: require('@/assets/icons/flag-list.png'),
  quizGlobe: require('@/assets/icons/quiz-globe.png'),
  scoreTrophy: require('@/assets/icons/score-trophy.png'),
  settingsGear: require('@/assets/icons/settings-gear.png'),
  statsChart: require('@/assets/icons/stats-chart.png'),
} as const;

type HomeIconSource = (typeof homeIcons)[keyof typeof homeIcons];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, MaxContentWidth);
  const actionCardWidth = (contentWidth - Spacing.three * 2 - Spacing.three) / 2;
  const actionTitleFontSize = Math.min(25, Math.max(19, actionCardWidth * 0.13));

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.container}>
          <View style={styles.hero}>
            <Image
              source={require('@/assets/images/home-hero.png')}
              style={styles.heroImage}
              contentFit="cover"
              accessibilityLabel="FLAG ATLAS"
            />
            <View style={styles.heroLogo}>
              <Text style={styles.heroLogoText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                FLAG ATLAS
              </Text>
            </View>
          </View>

          <View style={styles.primaryGrid}>
            <HomeAction
              title="通常クイズ"
              description="世界の国旗を学ぼう"
              accent="#0077f6"
              iconSource={homeIcons.quizGlobe}
              titleFontSize={actionTitleFontSize}
              onPress={() => router.push('/quiz?mode=normal')}
            />
            <HomeAction
              title="スコアアタック"
              description="ハイスコアを狙おう"
              accent="#ff8a00"
              iconSource={homeIcons.scoreTrophy}
              titleFontSize={actionTitleFontSize}
              onPress={() => router.push('/quiz?mode=score')}
            />
          </View>

          <View style={styles.secondaryGrid}>
            <SmallAction
              title="国旗一覧"
              iconSource={homeIcons.flagList}
              arrowColor="#ef2f1d"
              onPress={() => router.push('/flags')}
            />
            <SmallAction
              title="成績"
              iconSource={homeIcons.statsChart}
              arrowColor="#26b83f"
              onPress={() => router.push('/records')}
            />
            <SmallAction
              title="設定"
              iconSource={homeIcons.settingsGear}
              arrowColor="#7b8794"
              onPress={() => router.push('/settings')}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function HomeAction({
  accent,
  description,
  iconSource,
  onPress,
  title,
  titleFontSize,
}: {
  accent: string;
  description: string;
  iconSource: HomeIconSource;
  onPress: () => void;
  title: string;
  titleFontSize: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.homeAction, { backgroundColor: accent }, pressed && styles.pressed]}>
      <View style={styles.actionIconFrame}>
        <Image source={iconSource} style={styles.actionIcon} contentFit="contain" />
      </View>
      <Text style={[styles.actionTitle, { fontSize: titleFontSize, lineHeight: titleFontSize + 6 }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.actionDescription}>{description}</Text>
      <View style={styles.circleArrow}>
        <Text style={[styles.arrow, { color: accent }]}>›</Text>
      </View>
    </Pressable>
  );
}

function SmallAction({
  arrowColor,
  iconSource,
  onPress,
  title,
}: {
  arrowColor: string;
  iconSource: HomeIconSource;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}>
      <View style={styles.smallIconFrame}>
        <Image source={iconSource} style={styles.smallIcon} contentFit="contain" />
      </View>
      <Text style={styles.smallTitle}>{title}</Text>
      <View style={[styles.smallArrow, { backgroundColor: arrowColor }]}>
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
  heroLogo: {
    position: 'absolute',
    top: '30%',
    left: Spacing.four,
    right: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoText: {
    color: '#ffffff',
    fontSize: 46,
    lineHeight: 52,
    fontWeight: '900',
    letterSpacing: 0,
    textShadowColor: 'rgba(0, 76, 170, 0.28)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  primaryGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  homeAction: {
    flex: 1,
    minHeight: 190,
    borderRadius: 24,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.three,
    paddingBottom: 58,
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: Spacing.one,
    borderCurve: 'continuous',
  },
  actionIconFrame: {
    width: 88,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  actionIcon: {
    width: 84,
    height: 76,
  },
  actionTitle: {
    color: '#ffffff',
    fontWeight: '800',
    textAlign: 'center',
  },
  actionDescription: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    maxWidth: '86%',
    textAlign: 'center',
  },
  circleArrow: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  arrow: {
    fontSize: 30,
    lineHeight: 30,
    fontWeight: '800',
  },
  secondaryGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  smallAction: {
    flex: 1,
    minHeight: 146,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.one,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderCurve: 'continuous',
    boxShadow: '0 8px 22px rgba(0, 51, 102, 0.10)',
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.four,
    paddingBottom: 48,
  },
  smallIconFrame: {
    width: 62,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallIcon: {
    width: 58,
    height: 56,
  },
  smallTitle: {
    color: '#0a2a5c',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  smallArrow: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallArrowText: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
});
