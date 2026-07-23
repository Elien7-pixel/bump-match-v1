// Bump Match brand design tokens.
//
// Brand palette (from "Bump Match Colour Hex codes"):
//   Cream   #FEFAF6   Pastel Purple #AAA0DD   Pastel Red/Pink #FA92A9
//   Teal    #94D1CE   Pastel Yellow #FEDD8D
// Typography: Big Berry for headings/display, Poppins for body text.

// Named brand colours — shared by both themes and safe to use directly.
export const Brand = {
  cream: '#FEFAF6',
  purple: '#AAA0DD',
  purpleDeep: '#8C7FC9',   // darker purple for text/contrast on cream
  pink: '#FA92A9',
  pinkDeep: '#E96D89',     // darker pink for small text/accents
  teal: '#94D1CE',
  tealDeep: '#5FB3AF',     // darker teal for text/contrast
  yellow: '#FEDD8D',
  yellowDeep: '#EFC15C',
  ink: '#4A4459',          // warm dark for body text on cream
  // Soft tints for card fills / chips on cream backgrounds
  purpleSoft: '#EDEAF9',
  pinkSoft: '#FEE9EE',
  tealSoft: '#E4F4F3',
  yellowSoft: '#FFF5DC',
};

// Base tokens shared across themes
const BaseTokens = {
  gradients: {
    g1: ['#FA92A9', '#FEDD8D'] as const,   // pink → yellow
    g2: ['#AAA0DD', '#FA92A9'] as const,   // purple → pink
    g3: ['#FEDD8D', '#FFF5DC'] as const,   // yellow → soft yellow
    g4: ['#FA92A9', '#FEE9EE'] as const,   // pink → soft pink
    g5: ['#AAA0DD', '#94D1CE'] as const,   // purple → teal
    g6: ['#94D1CE', '#E4F4F3'] as const,   // teal → soft teal
    g7: ['#94D1CE', '#FEDD8D'] as const,   // teal → yellow
    g8: ['#EDEAF9', '#AAA0DD'] as const,   // soft purple → purple
    g9: ['#FA92A9', '#AAA0DD'] as const,   // pink → purple
    g10: ['#94D1CE', '#AAA0DD'] as const,  // teal → purple
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    s: 10,
    m: 16,
    l: 24,
    xl: 32,
    round: 999,
  },
  typography: {
    fontFamily: 'Poppins-Regular',
    fontFamilyMedium: 'Poppins-Medium',
    fontFamilySemiBold: 'Poppins-SemiBold',
    fontFamilyBold: 'Poppins-Bold',
    fontFamilyDisplay: 'BigBerry',        // headings / hero text
    sizes: {
      small: 12,
      body: 16,
      h3: 20,
      h2: 24,
      h1: 32,
      hero: 44,
    }
  },
  brand: Brand,
};

export const LightTheme = {
  ...BaseTokens,
  colors: {
    primary: Brand.pink,
    secondary: Brand.teal,
    accent: Brand.purple,
    destructive: '#E86A6A',
    background: Brand.cream,
    text: Brand.ink,
    textLight: '#FFFFFF',
    textDim: 'rgba(74, 68, 89, 0.6)',
    boyBlue: Brand.teal,
    girlPink: Brand.pink,
    neutralBeige: Brand.yellow,
    like: Brand.pink,
    dislike: '#B9B3C4',
    superLike: Brand.tealDeep,
    grey: '#A99FB5',
    shadow: 'rgba(233, 109, 137, 0.18)',   // soft pink shadow
    card: '#FFFFFF',
    border: '#F0E9E1',
    // Directional swipe feedback: card turns red (left), green (right), gold (up)
    swipeNo: '#E85D5D',
    swipeYes: '#5FBF77',
    swipeFav: '#F2B94B',
  },
};

export const DarkTheme = {
  ...BaseTokens,
  colors: {
    primary: Brand.pink,
    secondary: Brand.teal,
    accent: Brand.purple,
    destructive: '#E86A6A',
    background: '#2B2735',                // warm dark aubergine, not pure black
    text: '#F5F1EC',
    textLight: '#FFFFFF',
    textDim: 'rgba(245, 241, 236, 0.6)',
    boyBlue: Brand.teal,
    girlPink: Brand.pink,
    neutralBeige: Brand.yellow,
    like: Brand.pink,
    dislike: '#7C7589',
    superLike: Brand.teal,
    grey: '#8E8798',
    shadow: 'rgba(0, 0, 0, 0.4)',
    card: '#38323F',
    border: '#4A4459',
    // Directional swipe feedback: card turns red (left), green (right), gold (up)
    swipeNo: '#E85D5D',
    swipeYes: '#5FBF77',
    swipeFav: '#F2B94B',
  },
};

export type Theme = typeof LightTheme;
// Backward compatibility for now until refactor is complete
export const AppTokens = LightTheme;
