/**
 * Production-Grade Payment Gateway Service for Arun Gopal Traders
 * Handles: UPI Intent, Dynamic QR, Card Checkout, Cryptographic HMAC Verification, Webhooks & Idempotency
 */

import { supabase } from "@/integrations/supabase/client";

export type PaymentMethod = "upi" | "card" | "qr" | "cod" | "pay_at_store" | "netbanking";
export type PaymentStatus = "pending" | "processing" | "paid" | "failed" | "refunded" | "partially_refunded";

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id?: string;
  handler?: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    backdrop_color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
    confirm_close?: boolean;
    animation?: boolean;
  };
  config?: {
    display?: {
      blocks?: Record<string, unknown>;
      sequence?: string[];
      preferences?: {
        show_default_blocks?: boolean;
      };
    };
  };
  timeout?: number;
  retry?: {
    enabled?: boolean;
    max_count?: number;
  };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
  close: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

/**
 * 1. Safe, cached loader for Razorpay Checkout SDK
 */
let razorpayScriptLoadingPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptLoadingPromise) return razorpayScriptLoadingPromise;

  razorpayScriptLoadingPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("Failed to load Razorpay script.");
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptLoadingPromise;
}

/**
 * 2. Get Public Razorpay Key ID
 */
export function getPublicRazorpayKey(): string {
  if (typeof window === "undefined") return "";
  const envKey =
    (import.meta.env["VITE_RAZORPAY_KEY_ID"] as string | undefined) ||
    (import.meta.env["RAZORPAY_KEY_ID"] as string | undefined) ||
    "";
  return envKey.trim();
}

/**
 * 3. Generate standard NPCI Compliant UPI Intent URI (with exact amount and order reference)
 */
export function generateUpiUri(params: {
  vpa: string;
  payeeName: string;
  amount: number;
  orderNo: string;
  note?: string;
}): string {
  const vpa = params.vpa.trim();
  const pn = params.payeeName.trim();
  const am = params.amount.toFixed(2);
  const tr = params.orderNo.trim();
  const tn = (params.note || `Order ${params.orderNo} at Arun Gopal Traders`).trim();

  return `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(pn)}&am=${encodeURIComponent(am)}&cu=INR&tr=${encodeURIComponent(tr)}&tn=${encodeURIComponent(tn)}`;
}

/**
 * 4. Generate Dynamic QR Code Image URL using high-reliability standard QR engine
 */
export function generateQrCodeUrl(dataString: string, size = 260): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(dataString)}`;
}

/**
 * 5. Verify HMAC-SHA256 Signature (Cryptographic Verification via Web Crypto API)
 * Universal: Works in browser, Cloudflare Workers, Node 18+, Bun, Nitro
 */
export async function verifyHmacSha256(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    if (!data || !signature || !secret) return false;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(data)
    );
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return expectedSignature.toLowerCase() === signature.trim().toLowerCase();
  } catch (err) {
    console.error("HMAC verification error:", err);
    return false;
  }
}

/**
 * 6. Initiate Online Payment Session & Order Tracking on Database
 */
export async function recordPaymentAttemptOnServer(params: {
  orderId: string;
  orderNo: string;
  method: PaymentMethod;
  gateway?: string;
  gatewayOrderId?: string;
  amount: number;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  try {
    const { data, error } = await (supabase.rpc as Function)("record_payment_attempt", {
      p_order_id: params.orderId,
      p_order_no: params.orderNo,
      p_method: params.method,
      p_gateway: params.gateway || "razorpay",
      p_gateway_order_id: params.gatewayOrderId || null,
      p_amount: params.amount,
      p_metadata: params.metadata || {},
    });

    if (error) throw error;
    const res = data as { success?: boolean; payment_id?: string } | null;
    const result: { success: boolean; paymentId?: string } = {
      success: true,
    };
    if (res?.payment_id) {
      result.paymentId = res.payment_id;
    }
    return result;
  } catch (err: unknown) {
    console.warn("recordPaymentAttempt error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to log payment attempt" };
  }
}

/**
 * 7. Server-Side Verification Endpoint Caller
 * Sends transaction proof to secure verification procedure
 */
export async function verifyPaymentWithServer(params: {
  orderId: string;
  orderNo: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  signature: string;
  amount: number;
  paymentMethod: PaymentMethod;
  metadata?: Record<string, unknown>;
}): Promise<{
  success: boolean;
  alreadyPaid?: boolean;
  transactionId?: string;
  error?: string;
}> {
  try {
    // 1. Primary: Call backend API route if available
    try {
      const apiRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (apiRes.ok) {
        const apiData = (await apiRes.json()) as { success?: boolean; alreadyPaid?: boolean; transactionId?: string };
        if (apiData.success) {
          const resObj: { success: boolean; alreadyPaid?: boolean; transactionId?: string } = {
            success: true,
          };
          if (apiData.alreadyPaid !== undefined) resObj.alreadyPaid = apiData.alreadyPaid;
          if (apiData.transactionId || params.gatewayPaymentId) {
            resObj.transactionId = apiData.transactionId || params.gatewayPaymentId;
          }
          return resObj;
        }
      }
    } catch {
      // Fall through to database procedure verification
    }

    // 2. Authoritative Database Verification Procedure
    const { data, error } = await (supabase.rpc as Function)("verify_and_confirm_payment", {
      p_order_id: params.orderId,
      p_gateway_order_id: params.gatewayOrderId,
      p_gateway_payment_id: params.gatewayPaymentId,
      p_signature: params.signature,
      p_amount: params.amount,
      p_method: params.paymentMethod,
      p_metadata: params.metadata || {},
    });

    if (error) throw error;

    const res = data as {
      success?: boolean;
      already_paid?: boolean;
      transaction_id?: string;
      error?: string;
    } | null;

    if (!res?.success) {
      throw new Error(res?.error || "Payment verification failed on server");
    }

    const output: { success: boolean; alreadyPaid?: boolean; transactionId?: string } = {
      success: true,
    };
    if (res.already_paid !== undefined) output.alreadyPaid = res.already_paid;
    if (res.transaction_id || params.gatewayPaymentId) {
      output.transactionId = res.transaction_id || params.gatewayPaymentId;
    }

    return output;
  } catch (err: unknown) {
    console.error("Payment verification failure:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Payment verification failed",
    };
  }
}

/**
 * 8. Record Payment Cancellation or Failure
 */
export async function recordPaymentFailureOnServer(params: {
  orderId: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  errorCode?: string;
  errorDescription?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await (supabase.rpc as Function)("record_payment_failure", {
      p_order_id: params.orderId,
      p_gateway_order_id: params.gatewayOrderId || null,
      p_gateway_payment_id: params.gatewayPaymentId || null,
      p_error_code: params.errorCode || "PAYMENT_CANCELLED",
      p_error_desc: params.errorDescription || "Payment was cancelled or dismissed by customer",
      p_metadata: params.metadata || {},
    });
  } catch (err) {
    console.warn("recordPaymentFailure error:", err);
  }
}

