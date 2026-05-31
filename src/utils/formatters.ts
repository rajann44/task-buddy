import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

function getActiveLocale() {
  const lang = localStorage.getItem('taskbuddy_lang') || 'de'; // Default to German (de) for Commerzbank theme
  return lang === 'de' ? { dateFns: de, string: 'de-DE' } : { dateFns: enUS, string: 'en-US' };
}

export function formatDate(dateString: string): string {
  try {
    const locale = getActiveLocale();
    const pattern = locale.string === 'de-DE' ? 'dd.MM.yyyy' : 'MMM d, yyyy';
    return format(parseISO(dateString), pattern, { locale: locale.dateFns });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const locale = getActiveLocale();
    const pattern = locale.string === 'de-DE' ? 'dd.MM.yyyy • HH:mm' : 'MMM d, yyyy • h:mm a';
    return format(parseISO(dateString), pattern, { locale: locale.dateFns });
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const locale = getActiveLocale();
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: locale.dateFns });
  } catch {
    return dateString;
  }
}

export function formatCurrency(amount: number): string {
  const locale = getActiveLocale();
  return new Intl.NumberFormat(locale.string, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}
