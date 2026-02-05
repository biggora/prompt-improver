"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "es", name: "Español", flag: "🇪🇸" },
  ];

  const handleLanguageChange = (newLocale: string) => {
    // pathname looks like "/en/some-page"
    // we want to replace the locale part
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPathname = segments.join("/");
    router.push(newPathname);
  };

  return (
    <div className="flex items-center gap-2 bg-card/50 rounded-xl px-3 py-1.5 border border-border backdrop-blur-sm shadow-sm group hover:border-slate-400 dark:hover:border-slate-600 transition-all">
      <Globe
        size={16}
        className="text-muted-foreground group-hover:text-primary transition-colors"
      />
      <select
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-transparent text-sm text-foreground focus:outline-none cursor-pointer font-medium"
      >
        {languages.map((lang) => (
          <option
            key={lang.code}
            value={lang.code}
            className="bg-card text-foreground"
          >
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
