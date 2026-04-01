import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/context/theme-context";
import { LayoutProvider } from "@/context/layout-context";
import { BrandingProvider } from "@/context/branding-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LKMOVIE01 - AI Movie Search & Editor",
  description: "Advanced AI-powered movie scene search and editor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen overflow-hidden bg-background text-foreground transition-colors duration-500`}>
        <AuthProvider>
          <ThemeProvider>
            <BrandingProvider>
              <LayoutProvider>
                {children}
              </LayoutProvider>
            </BrandingProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
