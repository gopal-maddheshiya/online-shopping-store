import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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
    const [{ data: prof }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, phone, email")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    let userProfile = (prof as Profile) ?? null;
    if (!userProfile && userId) {
      try {
        const u = currentUser ?? session?.user;
        const { data: createdProf } = await supabase
          .from("profiles")
          .upsert(
            {
              id: userId,
              phone: u?.phone ?? null,
              email: u?.email ?? null,
              full_name: (u?.user_metadata?.["full_name"] as string) ?? null,
            },
            { onConflict: "id" },
          )
          .select("id, full_name, phone, email")
          .maybeSingle();
        if (createdProf) {
          userProfile = createdProf as Profile;
        }
      } catch {
        // Silently continue if upsert is restricted by RLS or handled by DB trigger
      }
    }

    setProfile(userProfile);
    const u = currentUser ?? session?.user;
    const isOwner = Boolean(
      (u?.phone && (u.phone.includes("6388354988") || u.phone.includes("638835"))) ||
      (u?.email && u.email === "gopalmaddheshiya138@gmail.com")
    );
    setIsAdmin(isOwner || Boolean(roles?.some((r) => r.role === "admin")));
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
