import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import ReactQueryProvider from "@/lib/react-query";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FGate | Admin Dashboard",
  description: "Sistema automatizado de gestión de membresías de Telegram",
  openGraph: {
    title: "FGate | Dashboard",
    description: "Panel administrativo premium para el control de suscripciones y bot de Telegram.",
    type: "website",
    locale: "es_ES",
    siteName: "FGate",
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
        className={`${outfit.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ReactQueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}

