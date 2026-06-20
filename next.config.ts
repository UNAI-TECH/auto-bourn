import type { NextConfig } from "next";
import path from "path";
import dns from "dns";

// Global DNS override to bypass unstable/broken local DNS resolver for Supabase in this sandbox
const originalLookup = dns.lookup;
dns.lookup = function (hostname: any, options: any, callback: any) {
  if (hostname === "njvgqybtgakgevnxmetf.supabase.co") {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    const all = options && (options as any).all;
    if (all) {
      return callback(null, [{ address: "172.64.149.246", family: 4 }] as any);
    } else {
      return callback(null, "172.64.149.246", 4);
    }
  }
  return originalLookup(hostname, options, callback);
} as any;

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

