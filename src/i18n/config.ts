export const locales = ["en", "ru", "de", "fr", "es"] as const;
export const defaultLocale = "en" as const;
export type Locale = (typeof locales)[number];
