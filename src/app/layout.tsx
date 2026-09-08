import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import AppChrome from "@/components/AppChrome";
import Atmosfera from "@/components/movimento/Atmosfera";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
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
    <html lang="pt-BR" className={`${archivo.variable} h-full`}>
      {/* Sem overflow-x aqui: isso transformaria o body num segundo
          contêiner de rolagem e quebraria o scroll da página. A atmosfera
          já se recorta sozinha. */}
      <body className="relative flex min-h-full flex-col bg-fundo text-texto font-interface antialiased">
        {/* Sem JS as revelações nunca receberiam a classe `visivel` e a tela
            ficaria em branco — então o padrão passa a ser "tudo visível". */}
        <noscript>
          <style>{`.revelar{opacity:1;transform:none;filter:none}
.linha-mascara>span{transform:none}
.palavra-revelada{opacity:1;transform:none;filter:none}`}</style>
        </noscript>
        <Atmosfera />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
