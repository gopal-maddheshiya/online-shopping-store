import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url?: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Initiates official Supabase Google OAuth sign-in flow.
 * Uses provider: "google" with appropriate redirect target.
 */
export async function signInWithGoogle(redirectTo?: string): Promise<{ error: Error | null }> {
  try {
    const targetUrl =
      redirectTo || (typeof window !== "undefined" ? window.location.href : "http://localhost:5173/account");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: targetUrl,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (error) return { error };
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadUserData(userId: string | undefined, currentUser?: User | null) {
    if (!userId) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }

    try {
      const [{ data: prof }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, phone, email")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);

      let userProfile = (prof as Profile) ?? null;
      const u = currentUser ?? session?.user;

      // Extract metadata from Supabase user / Google OAuth
      const googleName =
        (u?.user_metadata?.["full_name"] as string) ||
        (u?.user_metadata?.["name"] as string) ||
        null;
      const userEmail = u?.email || null;
      const userPhone = u?.phone || null;

      // 1. If profile doesn't exist yet, insert it idempotently
      if (!userProfile && userId) {
        try {
          const { data: createdProf } = await supabase
            .from("profiles")
            .upsert(
              {
                id: userId,
                phone: userPhone,
                email: userEmail,
                full_name: googleName,
              },
              { onConflict: "id" },
            )
            .select("id, full_name, phone, email")
            .maybeSingle();

          if (createdProf) {
            userProfile = createdProf as Profile;
          }
        } catch {
          // Handled silently if DB trigger already inserted
        }
      } else if (userProfile) {
        // 2. If profile exists, safely backfill missing email/name from Google without overwriting existing phone
        const updates: { full_name?: string; email?: string } = {};
        if (!userProfile.full_name && googleName) updates.full_name = googleName;
        if (!userProfile.email && userEmail) updates.email = userEmail;

        if (Object.keys(updates).length > 0) {
          try {
            const { data: updatedProf } = await supabase
              .from("profiles")
              .update(updates)
              .eq("id", userId)
              .select("id, full_name, phone, email")
              .maybeSingle();

            if (updatedProf) {
              userProfile = updatedProf as Profile;
            }
          } catch {
            // Non-blocking update failure
          }
        }
      }

      setProfile(userProfile);

      // Security check: only designated store owner or explicit DB admin roles have admin privileges
      const isOwner = Boolean(
        (u?.phone && (u.phone.includes("6388354988") || u.phone.includes("638835"))) ||
        (u?.email && u.email.toLowerCase() === "gopalmaddheshiya138@gmail.com")
      );
      setIsAdmin(isOwner || Boolean(roles?.some((r) => r.role === "admin")));
    } catch (err) {
      console.error("Error loading user profile:", err);
    }
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      void loadUserData(newSession?.user?.id, newSession?.user);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadUserData(data.session?.user?.id, data.session?.user).finally(() => setLoading(false));
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAdmin,
      loading,
      refreshProfile: () => loadUserData(session?.user?.id),
      signInWithGoogle,
    }),
    [session, profile, isAdmin, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
