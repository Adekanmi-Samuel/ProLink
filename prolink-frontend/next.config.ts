import type { NextConfig } from "next";

/**
 * Content Security Policy
 *
 * Defines exactly which sources are allowed to load resources.
 * Tuned specifically for ProLink's stack:
 *   - Vercel frontend + Vercel backend API
 *   - Cloudinary image/file CDN
 *   - Paystack payment scripts and iframes
 *   - Google Fonts
 *   - Socket.IO WebSocket connection to backend
 *
 * HOW TO READ THIS:
 *   default-src   = fallback for any directive not listed
 *   script-src    = which JS is allowed to execute
 *   style-src     = which CSS is allowed to load
 *   img-src       = which image sources are allowed
 *   connect-src   = fetch, XHR, WebSocket destinations
 *   frame-src     = which URLs can be iframed (Paystack popup)
 *   font-src      = web font sources
 *   object-src    = plugins (Flash etc) — always block these
 *   base-uri      = prevents base tag injection attacks
 *   form-action   = where forms can submit to
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  || process.env.NEXT_PUBLIC_API_URL
  || "https://prolink-backend.vercel.app/api";

const BACKEND_ORIGIN = "https://prolink-backend.vercel.app";

const ContentSecurityPolicy = `
  default-src 'self';

  script-src
    'self'
    'unsafe-inline'
    https://js.paystack.co
    https://js.paystack.co/v1/inline.js
    https://vercel.live
    https://*.vercel-scripts.com;

  style-src
    'self'
    'unsafe-inline'
    https://fonts.googleapis.com;

  img-src
    'self'
    data:
    blob:
    https://res.cloudinary.com
    https://*.cloudinary.com
    https://ui-avatars.com
    https://vercel.com;

  font-src
    'self'
    https://fonts.gstatic.com
    https://fonts.googleapis.com;

  connect-src
    'self'
    ${BACKEND_URL}
    ${BACKEND_ORIGIN}
    wss://${BACKEND_ORIGIN.replace(/^https?:\/\//, "")}
    ws://localhost:5000
    http://localhost:5000
    https://api.paystack.co
    https://standard.paystack.co
    https://*.cloudinary.com
    https://vitals.vercel-insights.com
    https://vercel.live;

  frame-src
    'self'
    https://paystack.com
    https://standard.paystack.co
    https://*.paystack.co
    https://vercel.live;

  frame-ancestors
    'none';

  object-src
    'none';

  base-uri
    'self';

  form-action
    'self'
    https://paystack.com
    https://standard.paystack.co;

  upgrade-insecure-requests;
`
  .replace(/\n/g, " ")
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  // ── Prevents clickjacking ──────────────────────────────────
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },

  // ── Prevents MIME-type sniffing ───────────────────────────
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  // ── Controls referrer information sent to third parties ───
  // strict-origin-when-cross-origin:
  //   - Same origin: sends full URL
  //   - Cross-origin HTTPS→HTTPS: sends only the origin (no path)
  //   - Cross-origin HTTPS→HTTP: sends nothing
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },

  // ── Restricts browser feature access ─────────────────────
  // Blocks APIs that ProLink doesn't use.
  // camera, microphone, geolocation: not used — block completely.
  // payment: needed for Paystack — allow self only.
  // clipboard-read/write: needed for copy-to-clipboard features.
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=(self)",
      "clipboard-read=(self)",
      "clipboard-write=(self)",
      "fullscreen=(self)",
      "display-capture=()",
      "usb=()",
      "serial=()",
      "battery=()",
    ].join(", "),
  },

  // ── Forces HTTPS for 2 years ──────────────────────────────
  // includeSubDomains: covers any subdomains
  // preload: eligible for browser HSTS preload list
  // (already set by Vercel but we reinforce it)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // ── Content Security Policy ───────────────────────────────
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },

  // ── Cross-Origin headers (upcoming, fixes Snyk warnings) ──

  // CORP: prevents other origins from loading your resources
  // Use "same-site" not "same-origin" because Vercel CDN
  // serves assets from different subdomains.
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },

  // COOP: prevents other windows from accessing your window object.
  // Important for OAuth popups and Paystack modal security.
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
    // Why allow-popups (not strict same-origin):
    // Paystack opens a popup window for 3D-secure auth.
    // "same-origin" would block that popup from communicating back.
  },

  // COEP: prevents loading resources without explicit CORS permission.
  // NOTE: Set to "unsafe-none" for now because Cloudinary images and
  // Paystack scripts don't send COEP-compatible headers.
  // Once those services add the headers, change to "require-corp".
  {
    key: "Cross-Origin-Embedder-Policy",
    value: "unsafe-none",
  },

  // ── Removes the X-Powered-By header ──────────────────────
  // Next.js removes this by default but we're explicit.
  // (Handled by poweredByHeader: false below)
];

const nextConfig: NextConfig = {
  // Remove X-Powered-By: Next.js header (fingerprinting)
  poweredByHeader: false,

  // Enable React Strict Mode for dev-time warnings
  reactStrictMode: true,

  // TypeScript type checking enforced at build time
  typescript: {
    ignoreBuildErrors: false,
  },

  // Optimize package imports for smaller bundles
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@tanstack/react-query',
    ],
  },

  // Security headers applied to all routes
  async headers() {
    return [
      {
        // Apply to ALL routes including API routes
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // For static assets (JS, CSS, images): relax CORP
        // because Vercel CDN serves these cross-origin
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Image optimization endpoint
        source: "/_next/image",
        headers: [
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ];
  },

  // Image domains for next/image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
