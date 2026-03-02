import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mapa de Asientos",
  description: "Editor visual interactivo de mapas de asientos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
