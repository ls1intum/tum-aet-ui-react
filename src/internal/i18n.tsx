import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

export const DEFAULT_TRANSLATIONS = {
  'tumAetUi.autocomplete.empty': 'No results found',
  'tumAetUi.autocomplete.remove': 'Remove',
  'tumAetUi.chip.remove': 'Remove',
  'tumAetUi.datePicker.timeZoneWarning': 'The displayed date and time use the {timeZone} time zone.',
  'tumAetUi.datePicker.clear': 'Clear date',
  'tumAetUi.datePicker.decrementHour': 'Decrement hour',
  'tumAetUi.datePicker.decrementMinute': 'Decrement minute',
  'tumAetUi.datePicker.dateDialog': 'Choose date',
  'tumAetUi.datePicker.dialog': 'Choose date and time',
  'tumAetUi.datePicker.done': 'Done',
  'tumAetUi.datePicker.hour': 'Hour',
  'tumAetUi.datePicker.incrementHour': 'Increment hour',
  'tumAetUi.datePicker.incrementMinute': 'Increment minute',
  'tumAetUi.datePicker.invalid': 'Enter a valid date and time.',
  'tumAetUi.datePicker.invalidDate': 'Enter a valid date.',
  'tumAetUi.datePicker.invalidTime': 'Enter a valid time.',
  'tumAetUi.datePicker.minute': 'Minute',
  'tumAetUi.datePicker.open': 'Open calendar',
  'tumAetUi.datePicker.openTime': 'Open clock',
  'tumAetUi.datePicker.datePlaceholder': 'DD.MM.YYYY',
  'tumAetUi.datePicker.placeholder': 'DD.MM.YYYY HH:mm',
  'tumAetUi.datePicker.nextMonth': 'Next month: {month}',
  'tumAetUi.datePicker.previousMonth': 'Previous month: {month}',
  'tumAetUi.datePicker.time': 'Time',
  'tumAetUi.datePicker.timeDialog': 'Choose time',
  'tumAetUi.datePicker.timePlaceholder': 'HH:mm',
  'tumAetUi.dialog.close': 'Close',
  'tumAetUi.inputNumber.increment': 'Increase value',
  'tumAetUi.inputNumber.decrement': 'Decrease value',
  'tumAetUi.inputNumber.roleDescription': 'Number field',
  'tumAetUi.splitter.resize': 'Resize panels',
  'tumAetUi.message.dismiss': 'Dismiss',
  'tumAetUi.panel.collapse': 'Collapse',
  'tumAetUi.panel.expand': 'Expand',
  'tumAetUi.paginator.ariaLabel': 'Pagination',
  'tumAetUi.paginator.currentPageReport': 'Showing {first} to {second} of {total}',
  'tumAetUi.paginator.first': 'First page',
  'tumAetUi.paginator.last': 'Last page',
  'tumAetUi.paginator.next': 'Next page',
  'tumAetUi.paginator.previous': 'Previous page',
  'tumAetUi.paginator.rowsPerPage': 'Rows per page',
  'tumAetUi.searchField.clear': 'Clear search',
  'tumAetUi.searchField.placeholder': 'Search',
  'tumAetUi.select.clear': 'Clear selection',
  'tumAetUi.select.empty': 'No available options',
  'tumAetUi.select.filter': 'Filter options',
  'tumAetUi.table.actions': 'Actions',
  'tumAetUi.table.noResults': 'No results found',
  'tumAetUi.table.searchPlaceholder': 'Search',
} as const satisfies Readonly<Record<string, string>>;

export type TranslationKey = keyof typeof DEFAULT_TRANSLATIONS;
export type TranslationParams = Readonly<Record<string, number | string>>;
export type Translator = (key: string, params?: TranslationParams) => string;

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match));
}

const defaultTexts: Readonly<Record<string, string | undefined>> = DEFAULT_TRANSLATIONS;
const defaultTranslator: Translator = (key, params) => interpolate(defaultTexts[key] ?? key, params);

const TranslatorContext = createContext<{ translate: Translator; locale?: string }>({ translate: defaultTranslator });

/** Replaces the built-in English texts, for example with the host application's i18n library. */
export function TumAetUiI18nProvider({
  translate,
  locale,
  children,
}: {
  translate: Translator;
  locale?: string;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ translate, locale }), [translate, locale]);
  return <TranslatorContext value={value}>{children}</TranslatorContext>;
}

/** Returns a stable-per-render translate function for built-in component texts (labels, aria texts). */
export function useTranslate(): Translator {
  const { translate } = useContext(TranslatorContext);
  return useCallback<Translator>((key, params) => translate(key, params), [translate]);
}

/** Locale for locale-sensitive browser formatting (dates, numbers). `undefined` means the browser default. */
export function useLocale(): string | undefined {
  return useContext(TranslatorContext).locale;
}
