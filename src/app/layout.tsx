import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google"; // Import Orbitron
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

import TargetCursor from "@/components/ui/TargetCursor";

import { SplashScreen } from "@/components/layout/SplashScreen";

export const metadata: Metadata = {
  title: "REVIL - Cyber Security Symposium",
  description: "National Level Technical Symposium by Dept of Cyber Security",
  icons: {
    icon: '/revil_icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${orbitron.variable} ${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col font-sans select-none`}
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        <SplashScreen />
        <TargetCursor
          spinDuration={2}
          hideDefaultCursor={true}
          parallaxOn={true}
          targetSelector="button, a, .cursor-target"
        />
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
