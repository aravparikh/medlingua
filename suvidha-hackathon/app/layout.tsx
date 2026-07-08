import type { Metadata } from "next";
import { Marcellus, Josefin_Sans } from "next/font/google";
import "./globals.css";
import { EVENT } from "@/lib/site";

const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marcellus",
  display: "swap",
});

const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-josefin",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Suvidha International Hackathon",
  description: `${EVENT.tagline} Organized by ${EVENT.organizer}. ${EVENT.eligibility}`,
  openGraph: {
    title: "Suvidha International Hackathon",
    description:
      "A fully virtual hackathon for middle & high schoolers — free to join, with up to $500 in prizes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${marcellus.variable} ${josefin.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:bg-gold focus:px-4 focus:py-2 focus:text-obsidian"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
