import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TeleGate | Admin Dashboard",
  description: "Sistema automatizado de gestión de membresías de Telegram",
  openGraph: {
    title: "TeleGate | Dashboard",
    description: "Panel administrativo premium para el control de suscripciones y bot de Telegram.",
    type: "website",
    locale: "es_ES",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ClientProviders googleClientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
