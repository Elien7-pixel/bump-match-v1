
export interface BabyName {
  id: string;
  name: string;
  gender: 'boy' | 'girl' | 'unisex';
  origin: string;
  meaning: string;
  language: string;
  popularity?: 'popular' | undefined;
  celebrity?: string; // e.g. "Beyoncé & Jay-Z"
  yearRank?: number; // SSA rank for a given year
}
