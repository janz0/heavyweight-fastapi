// File: app/layout.tsx
"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "@/app/styles/globals.css";
import { Provider as ChakraProvider } from "@/app/src/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Flex, Spinner } from "@chakra-ui/react";
import { ColorModeProvider } from "./src/components/ui/color-mode";
import { NavigationProvider } from "./context/NavigationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * This wrapper component lives INSIDE AuthProvider and decides
 * whether or not to show the Navbar based on authentication.
 */
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  // Pull auth state from your AuthProvider’s context:
  const { authToken, isChecking } = useAuth();

  // While we’re still verifying localStorage/session, show a blank (or spinner):
  if (isChecking) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" color="white" />
      </Flex>
    );
  }

  // If not authenticated, don’t render Navbar—just render the page’s children (login page).
  if (!authToken) {
    return <>{children}</>;
  }

  // Once authenticated, show the Navbar + whatever the page is (dashboard, etc.).
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ChakraProvider>
          <AuthProvider>
            <NavigationProvider>
            {/* 
              AuthenticatedLayout will conditionally show <Navbar> 
              based on whether `useAuth()` says we have a token.
            */}
            <AuthenticatedLayout>
              <ColorModeProvider>{children}</ColorModeProvider>
            </AuthenticatedLayout>
            <Toaster />
            </NavigationProvider>
          </AuthProvider>
        </ChakraProvider>
      </body>
    </html>
  );
}
