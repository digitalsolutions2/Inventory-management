import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale, Direction } from "@/lib/i18n/types";

interface LocaleStore {
  locale: Locale;
  direction: Direction;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: "en",
      direction: "ltr",
      setLocale: (locale) =>
        set({ locale, direction: locale === "ar" ? "rtl" : "ltr" }),
    }),
    { name: "locale-preference" }
  )
);
