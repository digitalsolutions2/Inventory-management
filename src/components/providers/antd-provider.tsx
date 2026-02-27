"use client";

import { ConfigProvider, App } from "antd";
import enUS from "antd/locale/en_US";
import arEG from "antd/locale/ar_EG";
import type { ReactNode } from "react";
import { useLocaleStore } from "@/store/locale";

export function AntdProvider({ children }: { children: ReactNode }) {
  const { locale, direction } = useLocaleStore();

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 6,
        },
      }}
      locale={locale === "ar" ? arEG : enUS}
      direction={direction}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
