import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { PlacesProvider } from "@/context/PlacesContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Waitly - Smart Queue Management",
  description: "Live wait times and virtual queues for your favorite places.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen bg-background antialiased touch-manipulation font-sans")}>
        <PlacesProvider>
          {children}
        </PlacesProvider>
      </body>
    </html>
  );
}
