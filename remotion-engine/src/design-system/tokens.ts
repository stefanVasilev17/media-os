export const COLORS = {
  background: '#07111F',
  deepSurface: '#0B1626',
  raisedSurface: '#0F1C2E',
  quietBorder: '#26364A',
  primaryText: '#F8FAFC',
  secondaryText: '#94A3B8',
  activeCyan: '#5CC8FF',
  success: '#34D399',
  waiting: '#F4B860',
  failure: '#F87171',
  authAccent: '#9B87F5',
  databaseAccent: '#48D6C7',
  phoneAccent: '#51C8FF',
} as const;

export const WORLD = {
  phone: [-4.25, -2.2, 0] as const,
  authService: [-0.35, -0.05, 0] as const,
  userDatabase: [3.85, 1.5, 0] as const,
} as const;
