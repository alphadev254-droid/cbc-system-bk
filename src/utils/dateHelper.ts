export const formatDate = (date: Date): string =>
  date.toISOString().split('T')[0];

export const isExpired = (date: Date): boolean =>
  new Date() > new Date(date);

export const daysBetween = (from: Date, to: Date): number =>
  Math.floor((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24));

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
