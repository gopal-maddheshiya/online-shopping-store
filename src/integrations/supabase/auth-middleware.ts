import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const DEFAULT_SUPABASE_URL = "https://rvpskkgrobztgcfznawl.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cHNra2dyb2J6dGdjZnpuYXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDc0MzAsImV4cCI6MjEwMzQyMzQzMH0.FCO6H2AWcHQ_QznsOVBsAuJxOUjMLs_qTjvrnsCxK4k";

const OWNER_ADMIN_EMAIL = "gopalmaddheshiya138@gmail.com";
const OWNER_ADMIN_ID = "3246a6a6-bceb-4112-8841-803bd01608f5";

function getSupabaseServerConfig() {
  const url =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    DEFAULT_SUPABASE_URL;
  const anonKey =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    DEFAULT_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export function createScopedSupabaseClient(accessToken: string): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseServerConfig();
  return createClient<Database>(url, anonKey, {
    global: {
      fetch: createSupabaseFetch(anonKey),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function verifyAdminJwtToken(token: string): Promise<{
  isAdmin: boolean;
  userId?: string;
  email?: string;
  supabase?: SupabaseClient<Database>;
}> {
  if (!token || token.split(".").length !== 3) {
    return { isAdmin: false };
  }

  const scoped = createScopedSupabaseClient(token);
  const { data: userData, error: userErr } = await scoped.auth.getUser(token);
  if (userErr || !userData?.user?.id) {
    return { isAdmin: false };
  }

  const user = userData.user;
  const email = (user.email || "").toLowerCase();
  if (user.id === OWNER_ADMIN_ID || email === OWNER_ADMIN_EMAIL) {
    return { isAdmin: true, userId: user.id, email, supabase: scoped };
  }

  const { data: roles } = await scoped
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const hasAdminRole = Boolean(roles?.some((r) => r.role === "admin"));
  if (!hasAdminRole) {
    return { isAdmin: false, userId: user.id, email };
  }

  return { isAdmin: true, userId: user.id, email, supabase: scoped };
}

export async function verifyAdminRequest(request: Request | null | undefined) {
  const authHeader = request?.headers?.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { isAdmin: false as const };
  }
  const token = authHeader.slice(7).trim();
  return await verifyAdminJwtToken(token);
}

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const { url, anonKey } = getSupabaseServerConfig();
    const request = getRequest();

    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Unauthorized: No authorization header provided");
    }
    if (!authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized: Only Bearer tokens are supported");
    }

    const token = authHeader.slice(7).trim();
    if (!token || token.split(".").length !== 3) {
      throw new Error("Unauthorized: Invalid token");
    }

    const supabase = createClient<Database>(url, anonKey, {
      global: {
        fetch: createSupabaseFetch(anonKey),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) {
      throw new Error("Unauthorized: Invalid token");
    }

    return next({
      context: {
        supabase,
        userId: data.claims.sub,
        claims: data.claims,
      },
    });
  },
);
