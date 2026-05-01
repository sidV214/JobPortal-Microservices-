"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string;

export const GoogleOAuthWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
};

/*
 * ===========================================================================================
 *                              NOTES — frontend/src/components/google-oauth-wrapper.tsx
 * ===========================================================================================
 *
 * PURPOSE: Wraps the app in Google OAuth context provider for Google Sign-In functionality.
 *
 * HOW IT WORKS:
 * - Reads NEXT_PUBLIC_GOOGLE_CLIENT_ID from .env.local
 * - Wraps children in GoogleOAuthProvider from @react-oauth/google
 * - This provides the useGoogleLogin() hook to child components (login/register pages)
 *
 * CONNECTIONS:
 * • layout.tsx → wraps children in <GoogleOAuthWrapper>
 * • (auth)/login/page.tsx → uses useGoogleLogin() for Google OAuth flow
 */
