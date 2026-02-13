import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";

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
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
            {children}
          </GoogleOAuthProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
