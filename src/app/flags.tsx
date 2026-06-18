import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppStore } from '@/hooks/use-app-store';
import { Country, countries, formatRegion, getFlagSource, Region, regions } from '@/lib/countries';

export default function FlagsScreen() {
  const store = useAppStore();
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<Region>('World');
  const [selected, setSelected] = useState<Country | null>(null);

  const filteredCountries = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return countries
      .filter((country) => region === 'World' || country.region === region)
      .filter((country) => {
        if (!keyword) {
          return true;
        }
        return (
          country.nameJa.toLowerCase().includes(keyword) ||
          country.nameEn.toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => a.nameJa.localeCompare(b.nameJa, 'ja'));
  }, [query, region]);

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>⚑ 国旗一覧</Text>
        <Text style={styles.description}>国旗をタップすると詳細を確認できます。</Text>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="国名で検索（例：日本）"
        placeholderTextColor="#8290a7"
        style={styles.search}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {regions.map((regionValue) => (
          <Pressable
            key={regionValue}
            onPress={() => setRegion(regionValue)}
            style={[styles.chip, region === regionValue && styles.chipActive]}>
            <Text style={[styles.chipText, region === regionValue && styles.chipTextActive]}>
              {formatRegion(regionValue)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.listHeader}>
        <Text style={styles.count}>{filteredCountries.length}か国</Text>
        <Text style={styles.sortLabel}>あいうえお順</Text>
      </View>

      <View style={styles.grid}>
        {filteredCountries.map((country) => {
          const stats = store.stats[country.id];
          const wrongRate = stats?.answerCount ? stats.wrongCount / stats.answerCount : 0;
          const isWeak = stats && stats.wrongCount > 0 && wrongRate >= 0.4;
          return (
            <Pressable
              key={country.id}
              onPress={() => setSelected(country)}
              style={({ pressed }) => [styles.countryCard, pressed && styles.pressed]}>
              <Image source={getFlagSource(country)} style={styles.flag} contentFit="contain" />
              <View style={styles.countryBody}>
                <Text style={styles.countryName} numberOfLines={1}>
                  {country.nameJa}
                </Text>
                <Text style={styles.countryRegion}>{formatRegion(country.region)}</Text>
              </View>
              <Pressable
                hitSlop={10}
                onPress={() => store.toggleFavorite(country.id)}
                style={styles.favoriteButton}>
                <Text style={[styles.favorite, store.favorites.has(country.id) && styles.favoriteActive]}>
                  {store.favorites.has(country.id) ? '★' : '☆'}
                </Text>
              </Pressable>
              {isWeak && (
                <View style={styles.weakBadge}>
                  <Text style={styles.weakBadgeText}>苦手</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <Modal visible={selected !== null} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <View style={styles.modalScreen}>
            <View style={styles.modalCard}>
              <Image source={getFlagSource(selected)} style={styles.modalFlag} contentFit="contain" />
              <Text style={styles.modalTitle}>{selected.nameJa}</Text>
              <Text style={styles.modalSubTitle}>{selected.nameEn}</Text>
              <DetailRow label="地域" value={formatRegion(selected.region)} />
              <DetailRow label="首都" value={selected.capital ?? '未登録'} />
              <DetailRow label="サブ地域" value={selected.subregion} />
              <Pressable onPress={() => setSelected(null)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>閉じる</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Modal>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
    textAlign: 'center',
  },
  search: {
    minHeight: 60,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#e2ebf7',
    backgroundColor: '#ffffff',
    color: '#08275a',
    fontSize: 17,
    fontWeight: '700',
    boxShadow: '0 6px 16px rgba(0, 51, 102, 0.08)',
  },
  chips: {
    gap: 10,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2ebf7',
  },
  chipActive: {
    backgroundColor: '#0077f6',
    borderColor: '#0077f6',
  },
  chipText: {
    color: '#08275a',
    fontSize: 14,
    fontWeight: '900',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    color: '#50627f',
    fontSize: 15,
    fontWeight: '800',
  },
  sortLabel: {
    color: '#50627f',
    fontSize: 14,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  countryCard: {
    width: '48%',
    minHeight: 110,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: '#ffffff',
    boxShadow: '0 8px 20px rgba(0, 51, 102, 0.08)',
  },
  pressed: {
    opacity: 0.72,
  },
  flag: {
    width: 76,
    height: 52,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2ebf7',
  },
  countryBody: {
    flex: 1,
    minWidth: 0,
  },
  countryName: {
    color: '#08275a',
    fontSize: 17,
    fontWeight: '900',
  },
  countryRegion: {
    color: '#50627f',
    fontSize: 13,
    fontWeight: '700',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  favorite: {
    color: '#9aa9bd',
    fontSize: 24,
  },
  favoriteActive: {
    color: '#ffb800',
  },
  weakBadge: {
    position: 'absolute',
    right: 10,
    bottom: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff8a00',
    backgroundColor: '#fff7ef',
  },
  weakBadgeText: {
    color: '#ff7900',
    fontSize: 11,
    fontWeight: '900',
  },
  modalScreen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f9ff',
  },
  modalCard: {
    gap: 16,
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#ffffff',
  },
  modalFlag: {
    width: '100%',
    height: 190,
  },
  modalTitle: {
    color: '#08275a',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalSubTitle: {
    color: '#50627f',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2ebf7',
  },
  detailLabel: {
    color: '#50627f',
    fontSize: 15,
    fontWeight: '800',
  },
  detailValue: {
    flex: 1,
    color: '#08275a',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'right',
  },
  closeButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#0077f6',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
});
