import type { Metadata } from "next";
import localFont from "next/font/local";
import { JsonLd } from "@/components/JsonLd";
import { DEFAULT_THEME, ThemeSwitcher, themeBootScript } from "@/components/Theme";
import { VeilProvider } from "@/components/Veil";
import { organization, website } from "@/lib/schema";
import { INDEXABLE, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";
import "./cityof.css";

const bricolage = localFont({
  src: "../fonts/BricolageGrotesque-Variable.woff2",
  variable: "--font-bricolage",
  display: "swap",
  weight: "200 800",
});

// Serif del brand kit: nomi delle città e titoli negli stili "Nostro" e "Luxury".
const serif = localFont({
  src: [
    { path: "../fonts/InstrumentSerif-Regular.ttf", style: "normal", weight: "400" },
    { path: "../fonts/InstrumentSerif-Italic.ttf", style: "italic", weight: "400" },
  ],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "City Of — Turn the helm. Choose your coast.", template: "%s | City Of" },
  description: "The best of each coastal city, picked by people who live there, with the price shown before you book.",
  // Il mockup non deve finire su Google: si apre all'indicizzazione solo al lancio.
  robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en_GB", images: ["/og-cityof-1200x630.png"] },
  icons: { icon: [{ url: "/favicon.ico" }, { url: "/favicon.svg", type: "image/svg+xml" }], apple: "/apple-touch-icon.png" },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${serif.variable}`} data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <VeilProvider>
          {children}
          <ThemeSwitcher />
        </VeilProvider>
        <JsonLd data={[organization(), website()]} />
      </body>
    </html>
  );
}
