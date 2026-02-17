import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AntdProvider } from "@/components/providers/antd-provider";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Supply Chain ERP",
  description: "F&B Supply Chain Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AntdProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AntdProvider>
      </body>
    </html>
  );
}
