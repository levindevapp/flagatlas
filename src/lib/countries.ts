import countriesJson from '../../data/countries.json';

export type Region =
  | 'World'
  | 'Asia'
  | 'Europe'
  | 'Africa'
  | 'North America'
  | 'South America'
  | 'Oceania';

export type Country = {
  id: number;
  code: string;
  nameJa: string;
  nameEn: string;
  region: Exclude<Region, 'World'>;
  subregion: string;
  flagImage: string;
  isQuizTarget: boolean;
  capital?: string;
};

const flagContext = require.context('../../assets/flags', false, /\.png$/);

export const regionLabels: Record<Region, string> = {
  World: '全世界',
  Asia: 'アジア',
  Europe: 'ヨーロッパ',
  Africa: 'アフリカ',
  'North America': '北アメリカ',
  'South America': '南アメリカ',
  Oceania: 'オセアニア',
};

export const regions = Object.keys(regionLabels) as Region[];

export const countries = countriesJson as Country[];

export const quizCountries = countries.filter((country) => country.isQuizTarget);

export function getCountriesByRegion(region: Region) {
  const source = region === 'World' ? quizCountries : quizCountries.filter((country) => country.region === region);
  return source;
}

export function getFlagSource(country: Pick<Country, 'flagImage'>) {
  return flagContext(`./${country.flagImage}`);
}

export function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function buildChoices(answer: Country, pool: Country[]) {
  const distractors = shuffle(pool.filter((country) => country.id !== answer.id)).slice(0, 3);
  return shuffle([answer, ...distractors]);
}

export function formatRegion(region: Region | Country['region']) {
  return regionLabels[region] ?? region;
}
