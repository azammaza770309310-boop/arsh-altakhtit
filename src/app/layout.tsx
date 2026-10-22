import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const amiri = localFont({
  src: [
    { path: "../../public/fonts/Amiri-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Amiri-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-amiri",
  display: "swap",
});

const tajawal = localFont({
  src: [
    { path: "../../public/fonts/Tajawal-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Tajawal-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/Tajawal-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/Tajawal-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "عرش التخطيط — لعبة تفاعلية على درس التخطيط",
  description:
    "كويز تفاعلي على شكل لعبة ملكية يغطي درس التخطيط كاملًا من مقرر مبادئ إدارة الأعمال: المفهوم، الخصائص، الفوائد، الأنواع، العناصر، الخطوات، والمعوقات.",
};

export const viewport: Viewport = {
  themeColor: "#0B0E1D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${amiri.variable} ${tajawal.variable} antialiased royal-app`}>
        {children}
      </body>
    </html>
  );
}
