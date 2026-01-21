
import { BabyName } from '../models/BabyName';

const rawData: BabyName[] = [
  { id: '1', name: 'Liam', gender: 'boy', origin: 'Irish', meaning: 'Strong-willed warrior', language: 'English' },
  { id: '2', name: 'Olivia', gender: 'girl', origin: 'Latin', meaning: 'Olive tree', language: 'English' },
  { id: '3', name: 'Noah', gender: 'boy', origin: 'Hebrew', meaning: 'Rest, comfort', language: 'English' },
  { id: '4', name: 'Emma', gender: 'girl', origin: 'German', meaning: 'Whole, universal', language: 'English' },
  { id: '5', name: 'Thabo', gender: 'boy', origin: 'African', meaning: 'Happiness', language: 'Zulu' },
  { id: '6', name: 'Nia', gender: 'girl', origin: 'African', meaning: 'Purpose', language: 'Swahili' },
  { id: '7', name: 'Kai', gender: 'unisex', origin: 'Hawaiian', meaning: 'Sea', language: 'English' },
  { id: '8', name: 'Aaliyah', gender: 'girl', origin: 'Arabic', meaning: 'High, exalted', language: 'English' },
  { id: '9', name: 'Bongani', gender: 'boy', origin: 'African', meaning: 'Be thankful', language: 'Zulu' },
  { id: '10', name: 'Lindiwe', gender: 'girl', origin: 'African', meaning: 'Waited for', language: 'Zulu' },
  { id: '11', name: 'Sipho', gender: 'boy', origin: 'African', meaning: 'Gift', language: 'Xhosa' },
  { id: '12', name: 'Zola', gender: 'girl', origin: 'African', meaning: 'Quiet, tranquil', language: 'Xhosa' },
  { id: '13', name: 'Johan', gender: 'boy', origin: 'German', meaning: 'God is gracious', language: 'Afrikaans' },
  { id: '14', name: 'Elize', gender: 'girl', origin: 'Hebrew', meaning: 'Pledged to God', language: 'Afrikaans' },
  { id: '15', name: 'Riaan', gender: 'boy', origin: 'Dutch', meaning: 'Little King', language: 'Afrikaans' },
  { id: '16', name: 'Aiden', gender: 'boy', origin: 'Irish', meaning: 'Little fire', language: 'English' },
  { id: '17', name: 'Aria', gender: 'girl', origin: 'Italian', meaning: 'Air; Song', language: 'English' },
  { id: '18', name: 'Jordan', gender: 'unisex', origin: 'Hebrew', meaning: 'Flowing down', language: 'English' },
  { id: '19', name: 'Kabelo', gender: 'boy', origin: 'African', meaning: 'Given', language: 'Sotho' },
  { id: '20', name: 'Mpho', gender: 'unisex', origin: 'African', meaning: 'Gift', language: 'Sotho' },
  { id: '21', name: 'Lerato', gender: 'unisex', origin: 'African', meaning: 'Love', language: 'Sotho' },
  { id: '22', name: 'Amara', gender: 'girl', origin: 'African', meaning: 'Grace', language: 'Igbo' },
  { id: '23', name: 'Kwame', gender: 'boy', origin: 'African', meaning: 'Born on Saturday', language: 'Akan' },
  { id: '24', name: 'Zoe', gender: 'girl', origin: 'Greek', meaning: 'Life', language: 'English' },
  { id: '25', name: 'Luca', gender: 'boy', origin: 'Italian', meaning: 'Bringer of light', language: 'English' },
];

interface FilterOptions {
  excludeIds?: string[];
  gender?: 'boy' | 'girl' | 'unisex' | 'all';
  language?: string;
}

export const getRandomNames = (count: number, options: FilterOptions = {}): BabyName[] => {
  const { excludeIds = [], gender = 'all', language = 'All' } = options;

  let filtered = rawData.filter(item => !excludeIds.includes(item.id));

  if (gender !== 'all') {
    if (gender === 'unisex') {
       // Typically users want to see unisex + requested gender if specific, but if they strictly want unisex:
       filtered = filtered.filter(item => item.gender === 'unisex');
    } else {
       // If gender is boy, show boys + unisex. If girl, show girls + unisex.
       // Actually user probably toggles "Boy", "Girl", "Neutral". 
       // Based on analysis: "Slider with 3 positions (0: Boy, 1: Neutral, 2: Girl)" 
       // If Neutral is selected, maybe it means Everything? Or just Unisex?
       // The analysis says "Slider... Mapped to 0.0, 1.0, 2.0". 
       // Let's assume:
       // Boy -> Boy + Unisex
       // Neutral -> All? Or just Unisex? Let's assume All for now or just Unisex. 
       // Let's stick to strict filtering for now:
       // If gender provided is 'boy', return 'boy' | 'unisex'.
       // If 'girl', return 'girl' | 'unisex'.
       filtered = filtered.filter(item => item.gender === gender || item.gender === 'unisex');
    }
  }

  if (language && language !== 'All') {
    filtered = filtered.filter(item => item.language === language);
  }

  // Shuffle
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
