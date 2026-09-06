import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import AppChrome from "@/components/AppChrome";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Reset",
  description: "Ritual diário.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The Reset",
  },
};

export const viewport: Viewport = {
  themeColor: "#101114",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${inter.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-fundo text-texto font-interface antialiased">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
