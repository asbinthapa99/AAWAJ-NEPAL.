import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { colors } from '../lib/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  c: typeof colors.dark;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  c: colors.dark,
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(systemScheme === 'light' ? 'light' : 'dark');

  const toggle = () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const c = mode === 'dark' ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider value={{ mode, c, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
