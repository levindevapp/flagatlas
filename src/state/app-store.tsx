import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useEffect, useMemo, useState } from 'react';

import { Country, Region } from '@/lib/countries';

export type CountryStats = {
  countryId: number;
  answerCount: number;
  correctCount: number;
  wrongCount: number;
  lastAnsweredAt: string;
};

export type ScoreHistory = {
  mode: 'normal' | 'score';
  region: Region;
  score: number;
  correctCount: number;
  totalQuestions: number;
  elapsedSeconds: number;
  playedAt: string;
};

type AppStoreValue = {
  favorites: Set<number>;
  histories: ScoreHistory[];
  stats: Record<number, CountryStats>;
  bestScore: number;
  toggleFavorite: (countryId: number) => void;
  recordAnswer: (country: Country, isCorrect: boolean) => void;
  recordHistory: (history: ScoreHistory) => boolean;
};

export const AppStoreContext = createContext<AppStoreValue | null>(null);

const storageKey = 'flagatlas:progress:v1';

type StoredProgress = {
  favoriteIds: number[];
  histories: ScoreHistory[];
  stats: Record<number, CountryStats>;
};

export function AppStoreProvider({ children }: PropsWithChildren) {
  const [favorites, setFavorites] = useState(() => new Set<number>());
  const [stats, setStats] = useState<Record<number, CountryStats>>({});
  const [histories, setHistories] = useState<ScoreHistory[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const bestScore = histories.reduce((best, history) => Math.max(best, history.score), 0);

  useEffect(() => {
    async function loadProgress() {
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        const stored = JSON.parse(raw) as StoredProgress;
        setFavorites(new Set(stored.favoriteIds ?? []));
        setStats(stored.stats ?? {});
        setHistories(stored.histories ?? []);
      }
      setIsHydrated(true);
    }

    loadProgress().catch(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const payload: StoredProgress = {
      favoriteIds: [...favorites],
      histories,
      stats,
    };

    AsyncStorage.setItem(storageKey, JSON.stringify(payload)).catch(() => undefined);
  }, [favorites, histories, isHydrated, stats]);

  const value = useMemo<AppStoreValue>(
    () => ({
      favorites,
      histories,
      stats,
      bestScore,
      toggleFavorite(countryId) {
        setFavorites((current) => {
          const next = new Set(current);
          if (next.has(countryId)) {
            next.delete(countryId);
          } else {
            next.add(countryId);
          }
          return next;
        });
      },
      recordAnswer(country, isCorrect) {
        setStats((current) => {
          const previous = current[country.id] ?? {
            countryId: country.id,
            answerCount: 0,
            correctCount: 0,
            wrongCount: 0,
            lastAnsweredAt: '',
          };
          return {
            ...current,
            [country.id]: {
              countryId: country.id,
              answerCount: previous.answerCount + 1,
              correctCount: previous.correctCount + (isCorrect ? 1 : 0),
              wrongCount: previous.wrongCount + (isCorrect ? 0 : 1),
              lastAnsweredAt: new Date().toISOString(),
            },
          };
        });
      },
      recordHistory(history) {
        const isBest = history.score > bestScore;
        setHistories((current) => [history, ...current].slice(0, 20));
        return isBest;
      },
    }),
    [bestScore, favorites, histories, stats]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}
