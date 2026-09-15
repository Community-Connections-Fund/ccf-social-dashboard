import type { NextConfig } from "next";

// Applied to every response. These are cheap, and the dashboard is a logged-in
// admin tool holding personal data, which is exactly the kind of page worth
// protecting from being framed or sniffed.
const SECURITY_HEADERS = [
  // Clickjacking: without this, a malicious page can load the dashboard in an
  // invisible frame over its own buttons and collect a signed-in admin's clicks —
  // "Remove staff" or "Delete post" among them. frame-ancestors is the modern
  // form; X-Frame-Options covers browsers that ignore it.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },

  // Stop browsers second-guessing a declared content type, which is how an
  // uploaded file can end up executed as script.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Do not hand full URLs to third-party sites. Dashboard URLs carry record ids.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Nothing here uses these devices; deny them rather than leave them available.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Stop announcing the framework and version in every response.
  poweredByHeader: false,

  headers() {
    return Promise.resolve([{ source: "/:path*", headers: SECURITY_HEADERS }]);
  },
};

export default nextConfig;
