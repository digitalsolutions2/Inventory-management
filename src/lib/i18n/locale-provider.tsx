"use client";

import { useEffect } from "react";
import { useLocaleStore } from "@/store/locale";
import { en } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";
import type { Locale, Direction, Dictionary } from "./types";

const dictionaries: Record<Locale, Dictionary> = { en, ar };

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { locale, direction } = useLocaleStore();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [locale, direction]);

  return <>{children}</>;
}

export function useTranslation() {
  const { locale, direction, setLocale } = useLocaleStore();
  const t = dictionaries[locale];
  return { t, locale, direction, setLocale } as {
    t: Dictionary;
    locale: Locale;
    direction: Direction;
    setLocale: (locale: Locale) => void;
  };
}
