import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// DATE & TIME FORMATTING
// ============================================

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatShortDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getDaysUntil(date: Date | string): number {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDaysBetween(startDate: Date | string, endDate: Date | string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function getTripStatus(startDate: Date | string, endDate: Date | string): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'active';
  return 'completed';
}

export function isToday(date: Date | string): boolean {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

export function isTomorrow(date: Date | string): boolean {
  const d = new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d.toDateString() === tomorrow.toDateString();
}

// ============================================
// COUNTRY & LOCALE UTILITIES
// ============================================

export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export const COUNTRY_DATA: Record<string, { 
  name: string; 
  currency: string; 
  timezone: string;
  plugType: string;
  voltage: string;
  emergencyNumber: string;
  drivingSide: 'left' | 'right';
  languages: string[];
  visaFreeFor?: string[];
}> = {
  US: { 
    name: 'United States', currency: 'USD', timezone: 'America/New_York',
    plugType: 'A/B', voltage: '120V', emergencyNumber: '911', drivingSide: 'right',
    languages: ['English'],
  },
  UK: { 
    name: 'United Kingdom', currency: 'GBP', timezone: 'Europe/London',
    plugType: 'G', voltage: '230V', emergencyNumber: '999', drivingSide: 'left',
    languages: ['English'],
  },
  JP: { 
    name: 'Japan', currency: 'JPY', timezone: 'Asia/Tokyo',
    plugType: 'A/B', voltage: '100V', emergencyNumber: '110', drivingSide: 'left',
    languages: ['Japanese'],
  },
  FR: { 
    name: 'France', currency: 'EUR', timezone: 'Europe/Paris',
    plugType: 'C/E', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['French'],
  },
  DE: { 
    name: 'Germany', currency: 'EUR', timezone: 'Europe/Berlin',
    plugType: 'C/F', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['German'],
  },
  IT: { 
    name: 'Italy', currency: 'EUR', timezone: 'Europe/Rome',
    plugType: 'C/F/L', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Italian'],
  },
  ES: { 
    name: 'Spain', currency: 'EUR', timezone: 'Europe/Madrid',
    plugType: 'C/F', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Spanish'],
  },
  TH: { 
    name: 'Thailand', currency: 'THB', timezone: 'Asia/Bangkok',
    plugType: 'A/B/C/O', voltage: '220V', emergencyNumber: '191', drivingSide: 'left',
    languages: ['Thai'],
  },
  SG: { 
    name: 'Singapore', currency: 'SGD', timezone: 'Asia/Singapore',
    plugType: 'G', voltage: '230V', emergencyNumber: '999', drivingSide: 'left',
    languages: ['English', 'Mandarin', 'Malay', 'Tamil'],
  },
  AU: { 
    name: 'Australia', currency: 'AUD', timezone: 'Australia/Sydney',
    plugType: 'I', voltage: '230V', emergencyNumber: '000', drivingSide: 'left',
    languages: ['English'],
  },
  AE: { 
    name: 'UAE', currency: 'AED', timezone: 'Asia/Dubai',
    plugType: 'G', voltage: '220V', emergencyNumber: '999', drivingSide: 'right',
    languages: ['Arabic', 'English'],
  },
  IN: { 
    name: 'India', currency: 'INR', timezone: 'Asia/Kolkata',
    plugType: 'C/D/M', voltage: '230V', emergencyNumber: '112', drivingSide: 'left',
    languages: ['Hindi', 'English'],
  },
  CN: { 
    name: 'China', currency: 'CNY', timezone: 'Asia/Shanghai',
    plugType: 'A/C/I', voltage: '220V', emergencyNumber: '110', drivingSide: 'right',
    languages: ['Mandarin'],
  },
  KR: { 
    name: 'South Korea', currency: 'KRW', timezone: 'Asia/Seoul',
    plugType: 'C/F', voltage: '220V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Korean'],
  },
  NZ: { 
    name: 'New Zealand', currency: 'NZD', timezone: 'Pacific/Auckland',
    plugType: 'I', voltage: '230V', emergencyNumber: '111', drivingSide: 'left',
    languages: ['English', 'Maori'],
  },
  CA: { 
    name: 'Canada', currency: 'CAD', timezone: 'America/Toronto',
    plugType: 'A/B', voltage: '120V', emergencyNumber: '911', drivingSide: 'right',
    languages: ['English', 'French'],
  },
  MX: { 
    name: 'Mexico', currency: 'MXN', timezone: 'America/Mexico_City',
    plugType: 'A/B', voltage: '127V', emergencyNumber: '911', drivingSide: 'right',
    languages: ['Spanish'],
  },
  BR: { 
    name: 'Brazil', currency: 'BRL', timezone: 'America/Sao_Paulo',
    plugType: 'C/N', voltage: '127V/220V', emergencyNumber: '190', drivingSide: 'right',
    languages: ['Portuguese'],
  },
  ZA: { 
    name: 'South Africa', currency: 'ZAR', timezone: 'Africa/Johannesburg',
    plugType: 'C/M/N', voltage: '230V', emergencyNumber: '10111', drivingSide: 'left',
    languages: ['English', 'Afrikaans', 'Zulu'],
  },
  EG: { 
    name: 'Egypt', currency: 'EGP', timezone: 'Africa/Cairo',
    plugType: 'C/F', voltage: '220V', emergencyNumber: '122', drivingSide: 'right',
    languages: ['Arabic'],
  },
  GR: { 
    name: 'Greece', currency: 'EUR', timezone: 'Europe/Athens',
    plugType: 'C/F', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Greek'],
  },
  PT: { 
    name: 'Portugal', currency: 'EUR', timezone: 'Europe/Lisbon',
    plugType: 'C/F', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Portuguese'],
  },
  NL: { 
    name: 'Netherlands', currency: 'EUR', timezone: 'Europe/Amsterdam',
    plugType: 'C/F', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Dutch', 'English'],
  },
  CH: { 
    name: 'Switzerland', currency: 'CHF', timezone: 'Europe/Zurich',
    plugType: 'C/J', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['German', 'French', 'Italian'],
  },
  AT: { 
    name: 'Austria', currency: 'EUR', timezone: 'Europe/Vienna',
    plugType: 'C/F', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['German'],
  },
  MY: { 
    name: 'Malaysia', currency: 'MYR', timezone: 'Asia/Kuala_Lumpur',
    plugType: 'G', voltage: '240V', emergencyNumber: '999', drivingSide: 'left',
    languages: ['Malay', 'English'],
  },
  ID: { 
    name: 'Indonesia', currency: 'IDR', timezone: 'Asia/Jakarta',
    plugType: 'C/F', voltage: '230V', emergencyNumber: '112', drivingSide: 'left',
    languages: ['Indonesian'],
  },
  VN: { 
    name: 'Vietnam', currency: 'VND', timezone: 'Asia/Ho_Chi_Minh',
    plugType: 'A/C', voltage: '220V', emergencyNumber: '113', drivingSide: 'right',
    languages: ['Vietnamese'],
  },
  PH: { 
    name: 'Philippines', currency: 'PHP', timezone: 'Asia/Manila',
    plugType: 'A/B/C', voltage: '220V', emergencyNumber: '911', drivingSide: 'right',
    languages: ['Filipino', 'English'],
  },
  HK: { 
    name: 'Hong Kong', currency: 'HKD', timezone: 'Asia/Hong_Kong',
    plugType: 'G', voltage: '220V', emergencyNumber: '999', drivingSide: 'left',
    languages: ['Cantonese', 'English'],
  },
  TW: { 
    name: 'Taiwan', currency: 'TWD', timezone: 'Asia/Taipei',
    plugType: 'A/B', voltage: '110V', emergencyNumber: '110', drivingSide: 'right',
    languages: ['Mandarin'],
  },
  TR: { 
    name: 'Turkey', currency: 'TRY', timezone: 'Europe/Istanbul',
    plugType: 'C/F', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Turkish'],
  },
  RU: { 
    name: 'Russia', currency: 'RUB', timezone: 'Europe/Moscow',
    plugType: 'C/F', voltage: '220V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Russian'],
  },
  SE: { 
    name: 'Sweden', currency: 'SEK', timezone: 'Europe/Stockholm',
    plugType: 'C/F', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Swedish'],
  },
  NO: { 
    name: 'Norway', currency: 'NOK', timezone: 'Europe/Oslo',
    plugType: 'C/F', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Norwegian'],
  },
  DK: { 
    name: 'Denmark', currency: 'DKK', timezone: 'Europe/Copenhagen',
    plugType: 'C/K', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Danish'],
  },
  FI: { 
    name: 'Finland', currency: 'EUR', timezone: 'Europe/Helsinki',
    plugType: 'C/F', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Finnish', 'Swedish'],
  },
  IE: { 
    name: 'Ireland', currency: 'EUR', timezone: 'Europe/Dublin',
    plugType: 'G', voltage: '230V', emergencyNumber: '112', drivingSide: 'left',
    languages: ['English', 'Irish'],
  },
  BE: { 
    name: 'Belgium', currency: 'EUR', timezone: 'Europe/Brussels',
    plugType: 'C/E', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Dutch', 'French', 'German'],
  },
  PL: { 
    name: 'Poland', currency: 'PLN', timezone: 'Europe/Warsaw',
    plugType: 'C/E', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Polish'],
  },
  CZ: { 
    name: 'Czech Republic', currency: 'CZK', timezone: 'Europe/Prague',
    plugType: 'C/E', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Czech'],
  },
  HU: { 
    name: 'Hungary', currency: 'HUF', timezone: 'Europe/Budapest',
    plugType: 'C/F', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Hungarian'],
  },
  HR: { 
    name: 'Croatia', currency: 'EUR', timezone: 'Europe/Zagreb',
    plugType: 'C/F', voltage: '230V', emergencyNumber: '112', drivingSide: 'right',
    languages: ['Croatian'],
  },
  MV: { 
    name: 'Maldives', currency: 'MVR', timezone: 'Indian/Maldives',
    plugType: 'G', voltage: '230V', emergencyNumber: '119', drivingSide: 'left',
    languages: ['Dhivehi', 'English'],
  },
  LK: { 
    name: 'Sri Lanka', currency: 'LKR', timezone: 'Asia/Colombo',
    plugType: 'D/G', voltage: '230V', emergencyNumber: '119', drivingSide: 'left',
    languages: ['Sinhala', 'Tamil', 'English'],
  },
  NP: { 
    name: 'Nepal', currency: 'NPR', timezone: 'Asia/Kathmandu',
    plugType: 'C/D/M', voltage: '230V', emergencyNumber: '100', drivingSide: 'left',
    languages: ['Nepali', 'English'],
  },
  QA: { 
    name: 'Qatar', currency: 'QAR', timezone: 'Asia/Qatar',
    plugType: 'G', voltage: '240V', emergencyNumber: '999', drivingSide: 'right',
    languages: ['Arabic', 'English'],
  },
  SA: { 
    name: 'Saudi Arabia', currency: 'SAR', timezone: 'Asia/Riyadh',
    plugType: 'G', voltage: '220V', emergencyNumber: '911', drivingSide: 'right',
    languages: ['Arabic'],
  },
  IL: { 
    name: 'Israel', currency: 'ILS', timezone: 'Asia/Jerusalem',
    plugType: 'C/H', voltage: '230V', emergencyNumber: '100', drivingSide: 'right',
    languages: ['Hebrew', 'Arabic'],
  },
  MA: { 
    name: 'Morocco', currency: 'MAD', timezone: 'Africa/Casablanca',
    plugType: 'C/E', voltage: '220V', emergencyNumber: '19', drivingSide: 'right',
    languages: ['Arabic', 'French'],
  },
  KE: { 
    name: 'Kenya', currency: 'KES', timezone: 'Africa/Nairobi',
    plugType: 'G', voltage: '240V', emergencyNumber: '999', drivingSide: 'left',
    languages: ['Swahili', 'English'],
  },
  AR: { 
    name: 'Argentina', currency: 'ARS', timezone: 'America/Buenos_Aires',
    plugType: 'C/I', voltage: '220V', emergencyNumber: '911', drivingSide: 'right',
    languages: ['Spanish'],
  },
  CL: { 
    name: 'Chile', currency: 'CLP', timezone: 'America/Santiago',
    plugType: 'C/L', voltage: '220V', emergencyNumber: '131', drivingSide: 'right',
    languages: ['Spanish'],
  },
  PE: { 
    name: 'Peru', currency: 'PEN', timezone: 'America/Lima',
    plugType: 'A/B/C', voltage: '220V', emergencyNumber: '105', drivingSide: 'right',
    languages: ['Spanish'],
  },
  CO: { 
    name: 'Colombia', currency: 'COP', timezone: 'America/Bogota',
    plugType: 'A/B', voltage: '110V', emergencyNumber: '123', drivingSide: 'right',
    languages: ['Spanish'],
  },
  CR: { 
    name: 'Costa Rica', currency: 'CRC', timezone: 'America/Costa_Rica',
    plugType: 'A/B', voltage: '120V', emergencyNumber: '911', drivingSide: 'right',
    languages: ['Spanish'],
  },
};

// ============================================
// STATUS & PROGRESS UTILITIES
// ============================================

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmed':
    case 'completed':
    case 'booked':
      return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    case 'active':
    case 'in_progress':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    case 'upcoming':
    case 'planning':
    case 'planned':
      return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    case 'delayed':
    case 'warning':
      return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    case 'cancelled':
    case 'critical':
      return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    default:
      return 'text-slate-600 bg-slate-100 dark:bg-slate-900/30';
  }
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    sightseeing: '🏛️',
    adventure: '🎯',
    food: '🍽️',
    entertainment: '🎭',
    relaxation: '🧘',
    shopping: '🛍️',
    cultural: '🎨',
    nature: '🌿',
    beach: '🏖️',
    nightlife: '🌙',
  };
  return icons[category] || '📍';
}

// ============================================
// FILE SIZE FORMATTING
// ============================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================
// VALIDATION UTILITIES
// ============================================

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s\-()]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// ============================================
// RANDOM ID GENERATION
// ============================================

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// ============================================
// DEEP LINK GENERATORS
// ============================================

export function generatePhoneLink(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`;
}

export function generateEmailLink(email: string, subject?: string): string {
  let link = `mailto:${email}`;
  if (subject) {
    link += `?subject=${encodeURIComponent(subject)}`;
  }
  return link;
}

export function generateWhatsAppLink(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  let link = `https://wa.me/${cleanPhone}`;
  if (message) {
    link += `?text=${encodeURIComponent(message)}`;
  }
  return link;
}
