import type { Metadata, Viewport } from "next";
import { Montserrat, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "SubConnects — The Verified Workforce Network for Roofing",
  description:
    "SubConnects is the verified workforce network for commercial roofing. We verify every crew's insurance, license, and references — by hand, by phone.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "SubConnects — The Verified Workforce Network for Roofing",
    description: "Find roofing crews you can actually trust. Verified. Trusted. Performance-driven.",
    url: "https://subconnects.com",
    siteName: "SubConnects",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1530",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable} ${mono.variable}`}>
      <body className="font-[family-name:var(--font-inter)] bg-bg text-white">
        {children}
      </body>
    </html>
  );
}
