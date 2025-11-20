// File: app/layout.tsx
"use client";

import { Geist, Geist_Mono, Inter } from "next/font/google";
import "@/app/styles/globals.css";
import { Provider as ChakraProvider } from "@/app/src/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "./components/UI/Navbar";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Box, Flex, Spinner } from "@chakra-ui/react";
import { ColorModeProvider } from "./src/components/ui/color-mode";
import { NavigationProvider } from "./context/NavigationContext";
import Sidebar from "./components/UI/SideNav";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/**
 * This wrapper component lives INSIDE AuthProvider and decides
 * whether or not to show the Navbar based on authentication.
 */
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  // Pull auth state from your AuthProvider’s context:
  const { authToken, isChecking } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isChecking && !authToken) {
      // Redirect to login if not authenticated
      router.replace("/");
    }
  }, [authToken, isChecking, router]);
  
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
    <Flex direction="column" h="100vh" overflow="hidden" bg="rgba(194, 213, 255, 0.40)" _dark={{background: "gray.900"}}>
      <Navbar />
      <Flex flex="1" minH="0" w="100vw" pl={{md: "2"}} gap="1">
        <Sidebar />
        <Box flex="1" px={{ base: 0, md: 8 }} py={{ base: 0, md: 4 }} overflowY="auto" bg="gray.100" _dark={{background: "gray.800"}}>{children}</Box>
      </Flex>
    </Flex>
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
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
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
