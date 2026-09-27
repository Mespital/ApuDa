import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApuDa — 내 건강의 흐름을 기억합니다",
  description:
    "검사, 증상, 치료, 진료 준비를 하나의 흐름으로 연결하는 ApuDa Health OS"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
