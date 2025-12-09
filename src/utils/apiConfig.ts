const API_URL_STORAGE_KEY = 'api_base_url';

export const COMMON_API_URLS = [
  { label: 'Apt', value: 'https://api.atoms.trade' },
  { label: 'SMC', value: 'https://smc.api.atoms.trade' },
  { label: 'Tradesmart', value: 'https://tradesmart.api.atoms.trade' },
  { label: 'Tradebulls', value: 'https://tradebulls.api.atoms.trade' },
];

export const DEFAULT_API_URL = COMMON_API_URLS[0].value;

export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_API_URL;
  }
  const stored = localStorage.getItem(API_URL_STORAGE_KEY);
  return stored || DEFAULT_API_URL;
}

export function setApiUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_URL_STORAGE_KEY, url);
  }
}

export function resetApiUrl(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(API_URL_STORAGE_KEY);
  }
}

