import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Format amount as USD currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format value as percentage with + for positive values
 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Calculate fee amount from a given amount
 * @param amount - The amount to calculate fee from
 * @param feeRate - Fee rate as decimal (default: 0.01 = 1%)
 */
export function calculateFee(amount: number, feeRate: number = 0.01): number {
  return amount * feeRate;
}

/**
 * Calculate net amount after fee deduction
 * @param amount - The original amount
 * @param feeRate - Fee rate as decimal (default: 0.01 = 1%)
 */
export function calculateNetAmount(
  amount: number,
  feeRate: number = 0.01
): number {
  return amount - calculateFee(amount, feeRate);
}

/**
 * Merge classNames using clsx and tailwind-merge
 */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}

/**
 * Format date to Spanish format
 * @param date - Date object or ISO string
 * @returns formatted date string (e.g., "15 de mayo de 2025")
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Format date to short Spanish format
 * @param date - Date object or ISO string
 * @returns formatted date string (e.g., "15/05/2025")
 */
export function formatDateShort(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

/**
 * Get relative time in Spanish
 * @param date - Date object or ISO string
 * @returns relative time string (e.g., "hace 2 días")
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (seconds < 60) {
    return 'hace unos segundos';
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }

  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }

  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
  }

  if (seconds < 2592000) {
    const weeks = Math.floor(seconds / 604800);
    return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }

  if (seconds < 31536000) {
    const months = Math.floor(seconds / 2592000);
    return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  }

  const years = Math.floor(seconds / 31536000);
  return `hace ${years} ${years === 1 ? 'año' : 'años'}`;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: minimum 8 characters, at least 1 number, at least 1 uppercase letter
 */
export function validatePassword(
  password: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a unique reference string for deposits/withdrawals
 * Format: ORINOCO-YYYYMMDD-XXXXXX (where X is random alphanumeric)
 */
export function generateReference(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORINOCO-${dateStr}-${random}`;
}

/**
 * Format currency for Venezuelan locale
 * @param value - Amount to format
 * @returns Formatted currency string
 */
export function formatCurrencyVES(value: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format time to Spanish locale
 * @param date - Date to format
 * @returns Formatted time string
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(dateObj);
}

/**
 * Calculate percentage change
 * @param currentValue - Current value
 * @param previousValue - Previous value
 * @returns Percentage change
 */
export function calculatePercentageChange(
  currentValue: number,
  previousValue: number
): number {
  if (previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param length - Max length
 * @returns Truncated text
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Validate Venezuelan ID (Cédula)
 * @param cedula - Cédula number
 * @returns Is valid cédula
 */
export function validateCedula(cedula: string): boolean {
  const cedulaRegex = /^[0-9]{6,8}$|^[VEJG][0-9]{6,8}$/;
  return cedulaRegex.test(cedula.toUpperCase());
}

/**
 * Format Venezuelan phone number
 * @param phone - Phone number
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+58 ${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  return phone;
}

/**
 * Get token from localStorage
 * @returns Auth token or null
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

/**
 * Set token in localStorage
 * @param token - Auth token
 */
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
}

/**
 * Remove token from localStorage
 */
export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
}

/**
 * Sleep utility for async operations
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
