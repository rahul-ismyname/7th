
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";
import { PlacesProvider } from "@/context/PlacesContext";
import { TicketsProvider } from "@/context/TicketsContext";
import { VendorProvider } from "@/context/VendorContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
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
}) {
    return (
        <html lang="en" className="h-full">
            <body className={cn(inter.className, "h-full bg-background antialiased touch-manipulation font-sans")}>
                <AuthProvider>
                    <PlacesProvider>
                        <VendorProvider>
                            <TicketsProvider>
                                {children}
                            </TicketsProvider>
                        </VendorProvider>
                    </PlacesProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
