import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { PropertyProvider } from "@/components/PropertyContext";

import { PropertyStoreProvider } from "@/components/PropertyStoreContext";
import { AuthProvider } from "@/components/AuthContext";
import { LocationProvider } from "@/components/LocationContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Covnant Reality India PVT LTD",
  description:
    "Discover premium properties — apartments, villas, plots, and commercial spaces. Your trusted real estate marketplace.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-bg text-text-primary`}>
        <ErrorBoundary>
          <AuthProvider>
            <LocationProvider>
              <PropertyStoreProvider>
                <PropertyProvider>
                  <AppShell>{children}</AppShell>
                </PropertyProvider>
              </PropertyStoreProvider>
            </LocationProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
