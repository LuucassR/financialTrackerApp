import { format, getDaysInMonth, getDate, getMonth, getYear, parseISO } from 'date-fns';

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getMonthBounds(year: number, month: number): { start: string; end: string } {
  const start = format(new Date(year, month, 1), 'yyyy-MM-dd');
  const end = format(new Date(year, month, getDaysInMonth(new Date(year, month))), 'yyyy-MM-dd');
  return { start, end };
}

export function getDaysRemaining(referenceDate: Date = new Date()): number {
  const year = getYear(referenceDate);
  const month = getMonth(referenceDate);
  const daysInMonth = getDaysInMonth(referenceDate);
  const today = getDate(referenceDate);
  return daysInMonth - today + 1;
}

export function getCurrentMonthLabel(): string {
  return format(new Date(), 'MMMM yyyy');
}

export function getMonthLabel(year: number, month: number): string {
  return format(new Date(year, month, 1), 'MMMM yyyy');
}

export function currentYearMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) return 'Hoy';
  if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) return 'Ayer';
  return format(date, 'dd/MM/yyyy');
}

export function isInstallmentActiveInMonth(
  startDate: string,
  totalInstallments: number,
  year: number,
  month: number
): boolean {
  const start = parseISO(startDate);
  const startYear = getYear(start);
  const startMonth = getMonth(start);
  const monthsElapsed = (year - startYear) * 12 + (month - startMonth);
  return monthsElapsed >= 0 && monthsElapsed < totalInstallments;
}

export function getInstallmentNumber(startDate: string, year: number, month: number): number {
  const start = parseISO(startDate);
  const monthsElapsed = (year - getYear(start)) * 12 + (month - getMonth(start));
  return monthsElapsed + 1;
}
