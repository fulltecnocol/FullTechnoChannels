import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { JsonLd } from "@/components/seo/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://full-techno-channels.web.app"),
  title: {
    default: "TeleGate | Gestión Automatizada de Telegram",
    template: "%s | TeleGate"
  },
  description: "La plataforma líder para monetizar canales de Telegram con bots inteligentes, red de afiliados de 10 niveles y pagos automáticos.",
  keywords: ["Telegram Monetization", "Affiliate Network", "Telegram Bot Business", "Passive Income Telegram", "Gestión de Membresías"],
  authors: [{ name: "Full Techno HUB" }],
  creator: "Full Techno HUB",
  publisher: "TeleGate",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "TeleGate | Dashboard Administrativo Premium",
    description: "Escala tu comunidad de Telegram al siguiente nivel con automatización total.",
    url: "https://full-techno-channels.web.app",
    siteName: "TeleGate",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TeleGate Premium Dashboard Preview",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TeleGate | Automatización de Telegram",
    description: "Monetiza tu contenido con la infraestructura más robusta del mercado.",
    images: ["/og-image.png"],
    creator: "@fulltechnohub",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
          <JsonLd />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
