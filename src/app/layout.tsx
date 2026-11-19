import type { Metadata } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pipeline",
  description: "Mini CRM de prospection : qui relancer aujourd'hui.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // next-themes pose la classe `dark` avant l'hydratation : l'écart serveur/client est attendu.
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${figtree.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
