
// Base tokens shared across themes
const BaseTokens = {
  gradients: {
    g1: ['#FF9A9E', '#FECFEF'] as const,
    g2: ['#a18cd1', '#fbc2eb'] as const,
    g3: ['#D4A574', '#E8C547'] as const,
    g4: ['#ff9a9e', '#fecfef'] as const,
    g5: ['#fbc2eb', '#a6c1ee'] as const,
    g6: ['#84fab0', '#8fd3f4'] as const,
    g7: ['#a1c4fd', '#c2e9fb'] as const,
    g8: ['#e0c3fc', '#8ec5fc'] as const,
    g9: ['#f093fb', '#f5576c'] as const,
    g10: ['#4facfe', '#00f2fe'] as const,
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
    s: 8,
    m: 12,
    l: 20,
    xl: 32,
    round: 999,
  },
  typography: {
    fontFamily: 'Inter_400Regular',
    fontFamilyBold: 'Inter_700Bold',
    sizes: {
      small: 12,
      body: 16,
      h3: 20,
      h2: 24,
      h1: 32,
      hero: 48,
    }
  }
};

export const LightTheme = {
  ...BaseTokens,
  colors: {
    primary: 'hsl(316, 69%, 72%)',
    secondary: 'hsl(184, 100%, 33%)',
    accent: 'hsl(142, 76%, 36%)',
    destructive: 'hsl(0, 84%, 60%)',
    background: '#FFFFFF',
    text: '#000000',
    textLight: '#FFFFFF',
    textDim: 'rgba(255, 255, 255, 0.7)',
    boyBlue: '#60A5FA',
    girlPink: '#F472B6',
    neutralBeige: '#D4A574',
    like: 'hsl(316, 69%, 72%)',
    dislike: 'hsl(0, 0%, 40%)',
    superLike: 'hsl(184, 100%, 33%)',
    grey: '#9CA3AF',
    shadow: 'rgba(0,0,0,0.2)',
    card: '#FFFFFF',
    border: '#E5E7EB',
  },
};

export const DarkTheme = {
  ...BaseTokens,
  colors: {
    primary: 'hsl(316, 69%, 62%)', // Slightly darker/richer for dark mode
    secondary: 'hsl(184, 100%, 33%)',
    accent: 'hsl(142, 76%, 36%)',
    destructive: 'hsl(0, 84%, 60%)',
    background: '#121212',
    text: '#FFFFFF',
    textLight: '#000000', // Inverted for dark mode if used on light backgrounds, but usually keep white. Let's make it textOnPrimary.
    textDim: 'rgba(255, 255, 255, 0.5)',
    boyBlue: '#60A5FA',
    girlPink: '#F472B6',
    neutralBeige: '#D4A574',
    like: 'hsl(316, 69%, 62%)',
    dislike: 'hsl(0, 0%, 60%)', // Lighter grey for visibility
    superLike: 'hsl(184, 100%, 33%)',
    grey: '#6B7280',
    shadow: 'rgba(0,0,0,0.5)',
    card: '#1E1E1E',
    border: '#374151',
  },
};

export type Theme = typeof LightTheme;
// Backward compatibility for now until refactor is complete
export const AppTokens = LightTheme;
