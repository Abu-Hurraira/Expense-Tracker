import { useTheme } from '../context/ThemeContext';

export function useChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    grid: isDark ? '#3a4540' : '#e8ebe6',
    tick: isDark ? '#9aa89f' : '#7c7c7c',
    cursor: isDark ? 'rgba(122, 154, 136, 0.2)' : 'rgba(95, 125, 107, 0.12)',
  };
}
