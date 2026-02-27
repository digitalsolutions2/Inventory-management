"use client";

import { useEffect, useState } from "react";
import { useLocaleStore } from "@/store/locale";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleLocale = () => {
    setLocale(locale === "en" ? "ar" : "en");
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors border border-gray-200 text-sm text-gray-600"
      title={locale === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
    >
      🌐 {locale === "en" ? "عربي" : "EN"}
    </button>
  );
}
