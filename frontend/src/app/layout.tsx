// app/layout.tsx
"use client"
//import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/styles/globals.css"; // your global styles
import { Provider as ChakraProvider } from "@/app/src/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "./components/Navbar";
import { AuthProvider } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
/*
export const metadata: Metadata = {
  title: "Heavyweight FastAPI UI",
  description: "Your new Next.js + Chakra UI front-end",
};
*/
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ChakraProvider>
          <AuthProvider>
          <Navbar />
          {children}
          <Toaster />
          </AuthProvider>
        </ChakraProvider>
      </body>
    </html>
  );
}
