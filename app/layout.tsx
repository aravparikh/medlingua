import type { Metadata } from "next";
import { Lexend, Noto_Sans } from "next/font/google";
import "./globals.css";

// The same pairing the app ships: Lexend for display (drawn to improve
// reading proficiency), Noto Sans for body (Latin, Vietnamese, Cyrillic).
const lexend = Lexend({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const notoSans = Noto_Sans({
  subsets: ["latin", "latin-ext", "cyrillic", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MedLingua — Speak with your doctor, in your language",
  description:
    "Real-time medical conversation between English and Spanish, Chinese, Vietnamese, or Russian — doses and drug names kept exact, nothing saved, on a phone you already own.",
  openGraph: {
    title: "MedLingua",
    description:
      "Speak with your doctor — in your language. Real-time medical translation for limited-English-proficiency patients.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lexend.variable} ${notoSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
