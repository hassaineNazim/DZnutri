/**
 * ThemeContext — pilote le mode sombre du design system.
 *
 * La palette vit dans `tokens.colors` (objet mutable) : les styles des écrans
 * sont inline, donc réévalués à chaque rendu. Basculer = muter la palette PUIS
 * remonter l'arbre (clé sur la racine dans _layout) pour tout repeindre.
 * La préférence est persistée dans AsyncStorage et rechargée avant le premier
 * rendu (voir loadStoredThemeScheme dans _layout).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { applyThemeScheme, getThemeScheme, ThemeScheme } from './tokens';

const STORAGE_KEY = 'appThemeScheme';

// À appeler AVANT le premier rendu (gate dans _layout) pour éviter un flash clair.
export async function loadStoredThemeScheme(): Promise<ThemeScheme> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const scheme: ThemeScheme = stored === 'dark' ? 'dark' : 'light';
    applyThemeScheme(scheme);
    return scheme;
  } catch {
    applyThemeScheme('light');
    return 'light';
  }
}

type ThemeContextValue = {
  scheme: ThemeScheme;
  isDark: boolean;
  setScheme: (scheme: ThemeScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'light',
  isDark: false,
  setScheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<ThemeScheme>(getThemeScheme());

  const setScheme = useCallback((next: ThemeScheme) => {
    applyThemeScheme(next); // mute la palette partagée
    setSchemeState(next); // déclenche le re-rendu (clé de racine dans _layout)
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  return (
    <ThemeContext.Provider value={{ scheme, isDark: scheme === 'dark', setScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
