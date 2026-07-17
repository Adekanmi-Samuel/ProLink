import { useColorScheme } from 'react-native';
import { dark, light } from '../theme/tokens';
import type { Theme } from '../theme/tokens';

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'light' ? light : dark;
}
