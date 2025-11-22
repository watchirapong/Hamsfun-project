import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import React from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const notoSansThai = Noto_Sans_Thai({ subsets: ["thai"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Hamstellar",
  description: "anyone can be anything",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} ${notoSansThai.className} h-full m-0 p-0`}>
        {children}
      </body>
    </html>
  );
}

