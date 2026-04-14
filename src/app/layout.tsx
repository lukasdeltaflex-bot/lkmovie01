import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/context/theme-context";
import { LayoutProvider } from "@/context/layout-context";
import { BrandingProvider } from "@/context/branding-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
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
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${poppins.variable} antialiased h-screen overflow-hidden bg-[#0a0a0a] text-white transition-colors duration-500 font-sans`}>
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
