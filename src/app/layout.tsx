import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://qollar.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Qollar — Protege a tu mascota 🐾",
    template: "%s | Qollar",
  },
  description:
    "La app peruana que protege a tu mascota con QR inteligente. Si se pierde, cualquier persona escanea su plaquita y te avisa al instante con GPS.",
  keywords: [
    "mascota perdida",
    "perro perdido",
    "gato perdido",
    "plaquita QR",
    "collar QR",
    "encontrar mascota",
    "app mascotas Perú",
    "Qollar",
  ],
  authors: [{ name: "Qollar Perú" }],
  creator: "Qollar",
  publisher: "Qollar",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Qollar",
  },
  openGraph: {
    title: "Qollar — Protege a tu mascota 🐾",
    description:
      "Plaquita QR inteligente para mascotas. Si se pierde, cualquier persona escanea y te avisa con GPS al instante.",
    type: "website",
    url: APP_URL,
    siteName: "Qollar",
    locale: "es_PE",
  },
  twitter: {
    card: "summary",
    title: "Qollar — Protege a tu mascota 🐾",
    description:
      "Plaquita QR inteligente para mascotas en Perú. Localiza a tu mascota perdida al instante.",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B35",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#241840",
              color: "#F8F4FF",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#10B981", secondary: "#241840" },
            },
            error: {
              iconTheme: { primary: "#FF6B35", secondary: "#241840" },
            },
          }}
        />
      </body>
    </html>
  );
}
