export const colors = {
  ink: '#0D193F',
  muted: '#727BA2',
  teal: '#007F8B',
  tealDark: '#006F7A',
  pale: '#EDF7F8',
  border: '#EFF1F6',
  subtle: '#F7F8FB',
  white: '#FFFFFF',
  mint: '#E6FAEF',
  red: '#B43F4A',
};
export const font = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
};
export const money = (paise: number) =>
  `₹ ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(paise / 100)}`;
export function ordinal(n: number) {
  return `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : (({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th')}`;
}
