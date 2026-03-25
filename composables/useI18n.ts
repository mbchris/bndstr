import en from '~/i18n/en';
import de from '~/i18n/de';

type Messages = typeof en;
type Locale = 'en' | 'de';

const messages: Record<Locale, Messages> = { en, de };

// Shared reactive locale state (module-level singleton)
const currentLocale = ref<Locale>('en');
let _initialized = false;

function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language || (navigator as any).userLanguage || 'en';
  return lang.startsWith('de') ? 'de' : 'en';
}

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path;
}

export function useI18n() {
  // Initialize locale once on client
  if (process.client && !_initialized) {
    _initialized = true;
    const saved = localStorage.getItem('bndstr-locale') as Locale | null;
    currentLocale.value = saved || detectBrowserLocale();
  }

  const locale = currentLocale;

  function setLocale(l: Locale) {
    currentLocale.value = l;
    if (process.client) {
      localStorage.setItem('bndstr-locale', l);
    }
  }

  /**
   * Translate a key. Supports interpolation with {variable} syntax.
   * Example: t('rehearsal.bringingBeer', { name: 'Chris' })
   */
  function t(key: string, params?: Record<string, string | number>): string {
    let val = getNestedValue(messages[currentLocale.value], key);
    if (typeof val !== 'string') return key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return val;
  }

  /** Get a raw value (e.g. arrays like calendar.days) */
  function tv(key: string): any {
    return getNestedValue(messages[currentLocale.value], key);
  }

  /** Get the date locale string for Intl APIs */
  const dateLocale = computed(() => currentLocale.value === 'de' ? 'de-DE' : 'en-US');

  return { t, tv, locale, setLocale, dateLocale };
}
