import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/context/AppContext";
import { GoogleOAuthWrapper } from "@/components/google-oauth-wrapper";

export const metadata: Metadata = {
  title: "JobNexus - Premium Job Portal",
  description: "Revolutionizing the job search experience with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="relative min-h-screen text-slate-200" suppressHydrationWarning>
        {/* Premium Dark Space Background with Glowing Orbs */}
        <div className="fixed inset-0 z-[-1] bg-slate-950">
          <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>
        </div>
        
        <AppProvider>
          <GoogleOAuthWrapper>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              forcedTheme="dark"
              disableTransitionOnChange
            >
              <NavBar />
              <main className="flex-1">
                {children}
              </main>
            </ThemeProvider>
          </GoogleOAuthWrapper>
        </AppProvider>
      </body>
    </html>
  );
}

/*
 * ===========================================================================================
 *                              NOTES — frontend/src/app/layout.tsx
 * ===========================================================================================
 *
 * PURPOSE: Root layout for the entire Next.js application. Wraps every page with:
 * - Global CSS, dark theme, background effects
 * - AppProvider (state management)
 * - GoogleOAuthWrapper (Google Sign-In)
 * - ThemeProvider (shadcn dark mode)
 * - NavBar (persistent navigation)
 *
 * PROVIDER NESTING ORDER (outermost to innermost):
 * <html> → <body> → <AppProvider> → <GoogleOAuthWrapper> → <ThemeProvider> → <NavBar> + {children}
 *
 * BACKGROUND DESIGN:
 * Fixed position div with indigo/purple gradient orbs creates the premium dark space aesthetic.
 * Uses z-[-1] to sit behind all content, blur-[120px] for soft glow effect.
 *
 * SEO: metadata exports title and description for all pages.
 *
 * suppressHydrationWarning: Required by next-themes to prevent hydration mismatch
 * when the theme is set before React hydrates.
 *
 * forcedTheme="dark": Always dark mode. No light mode toggle.
 *
 * CONNECTIONS: Every page in /app/ is rendered as {children} inside this layout.
 */
