import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NoiseOverlay } from "@/components/ui/noise-overlay";
import { SidebarProvider } from "@/components/layout/app-sidebar";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ChannelsProvider } from "@/contexts/channels-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CreatorPulse - YouTube Comment Analytics",
  description: "AI-powered YouTube comment analysis and insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f0f0f] text-[#e5e5e5] selection:bg-white selection:text-black`}
      >
        <AuthProvider>
          <NoiseOverlay />
          <ChannelsProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </ChannelsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
