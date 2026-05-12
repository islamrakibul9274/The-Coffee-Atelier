import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import AppLayout from "@/components/AppLayout";
import AtelierToaster from "@/components/AtelierToaster";

export const metadata: Metadata = {
  title: "The Coffee Atelier | Artisanal Roastery",
  description: "A high-end, artisan coffee experience. Curated roasts for the true connoisseur.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <AuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <AtelierToaster />
        </AuthProvider>
      </body>
    </html>
  );
}
