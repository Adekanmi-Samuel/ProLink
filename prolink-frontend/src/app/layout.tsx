import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import VerificationBanner from "../components/VerificationBanner";
import Providers from "./providers";
import ThemeProvider from "../components/ThemeProvider";
import LandingAnimator from "../components/LandingAnimator";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-heading' });
const inter = Inter({ subsets: ["latin"], variable: '--font-body', weight: ['300', '400', '500', '600', '700'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: '--font-mono' });

export const metadata = {
  title: "ProLink Nigeria — Hire Skilled Professionals & Find Work",
  description: "Nigeria's professional freelance network. Connect with verified professionals, pay in Naira, and get work done securely with escrow protection.",
  keywords: ["freelance", "Nigeria", "hiring", "jobs", "professionals", "remote work", "Naira", "escrow"],
  authors: [{ name: "ProLink" }],
  openGraph: {
    title: "ProLink Nigeria — Hire Skilled Professionals & Find Work",
    description: "Nigeria's professional freelance network. Connect with verified professionals, pay in Naira, and get work done securely.",
    url: "https://prolink.vercel.app",
    siteName: "ProLink",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ProLink Nigeria",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProLink Nigeria",
    description: "Nigeria's professional freelance network.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="smooth-scroll" data-scroll-behavior="smooth">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`} style={{ margin: 0, padding: 0 }}>
        <Script id="js-loaded" strategy="afterInteractive">
          {`document.body.classList.add('js-loaded')`}
        </Script>
        <Providers>
          <ThemeProvider>
            {/* Skip navigation link — visible only on keyboard focus (WCAG 2.4.1 Bypass Blocks) */}
            <a
              href="#main-content"
              className="skip-link"
            >
              Skip to main content
            </a>
            <Navbar />
            <VerificationBanner />
            <main id="main-content" style={{ paddingTop: 'var(--navbar-h)' }}>
              <LandingAnimator>
                {children}
              </LandingAnimator>
            </main>
          </ThemeProvider>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}