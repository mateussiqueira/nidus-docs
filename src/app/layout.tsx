import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nidus — Self-Hosted Deploy Platform",
  description:
    "Production-grade self-hosted deploy platform. Go control plane, Rust data plane. Think Vercel that runs on your own machine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          fontFamily: "var(--font-inter), system-ui, sans-serif",
        }}
      >
        <Sidebar />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              maxWidth: "52rem",
              margin: "0 auto",
              padding: "2.5rem 2rem",
            }}
          >
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
