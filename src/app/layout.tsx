import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai, Jersey_25 } from "next/font/google";
import React from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const notoSansThai = Noto_Sans_Thai({ subsets: ["thai"], weight: ["400", "500", "600", "700"] });
const jersey25 = Jersey_25({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Hamstellar",
  description: "ปกป้องโลกจากภัยร้าย - Protect the world from evil",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} ${notoSansThai.className} ${jersey25.className} h-full m-0 p-0 overflow-hidden`}>{children}</body>
    </html>
  );
}

