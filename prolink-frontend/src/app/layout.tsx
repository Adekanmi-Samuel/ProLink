import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import VerificationBanner from "../components/VerificationBanner";
import Providers from "./providers";
import ThemeProvider from "../components/ThemeProvider";
import LandingAnimator from "../components/LandingAnimator";
import Script from "next/script";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-heading' });
const inter = Inter({ subsets: ["latin"], variable: '--font-body', weight: ['300', '400', '500', '600', '700'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: '--font-mono' });

export const metadata = {
  title: "ProLink Nigeria — Hire Skilled Professionals & Find Work",
  description: "Nigeria's professional freelance network. Connect with verified professionals, pay in Naira, and get work done securely with escrow protection.",
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
            <Navbar />
            <VerificationBanner />
            <main>
              <LandingAnimator>
                {children}
              </LandingAnimator>
            </main>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}