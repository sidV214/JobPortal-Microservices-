// https://checkout.razorpay.com/v1/checkout.js
"use client";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const useRazorpay = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setLoaded(true);
      document.body.appendChild(script);
    } else if (window.Razorpay) {
      setLoaded(true);
    }
  }, []);

  return loaded;
};

export default useRazorpay;

/*
 * ===========================================================================================
 *                              NOTES — frontend/src/components/scriptLoader.tsx
 * ===========================================================================================
 *
 * PURPOSE: Custom React hook that dynamically loads the Razorpay Checkout.js SDK.
 * Returns a boolean indicating whether the script has finished loading.
 *
 * HOW IT WORKS:
 * 1. On mount, checks if window.Razorpay already exists (already loaded)
 * 2. If not, creates a <script> tag pointing to Razorpay's CDN
 * 3. Appends it to document.body with async=true
 * 4. On script load, sets loaded=true → component can now open Razorpay checkout
 *
 * USAGE: const isLoaded = useRazorpay(); if (isLoaded) { new window.Razorpay(options) }
 *
 * declare global { interface Window { Razorpay?: any } }
 * → TypeScript global augmentation to tell TS that window.Razorpay exists
 *
 * CONNECTIONS: Used by /subscribe page to load Razorpay before opening checkout modal.
 */
