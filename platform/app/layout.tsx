import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "My ApuDa | 내 건강의 흐름을 정리해요",
    template: "%s | My ApuDa"
  },
  description:
    "검사, 증상, 치료, 복약, 영상검사와 다음 진료 준비를 한곳에 정리하는 ApuDa 개인 건강관리 공간입니다.",
  applicationName: "My ApuDa",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://my.apuda.app")
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
