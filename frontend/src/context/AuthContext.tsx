'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
    id: string;
    full_name: string;
    avatar_url?: string;
    credits: number;
    role: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null, session: null, profile: null, loading: true,
    signOut: async () => { }, refreshProfile: async () => { },
});

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchProfile = async (userId: string, accessToken?: string) => {
        // Try Supabase client first (fast)
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (data) { setProfile(data); return; }

        // Fallback: backend uses service role key — also creates profile if missing
        try {
            const token = accessToken || (await supabase.auth.getSession()).data.session?.access_token;
            if (!token) return;
            const res = await fetch(`${BACKEND}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const p = await res.json();
                setProfile(p);
            }
        } catch { }
    };

    const refreshProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) await fetchProfile(session.user.id, session.access_token);
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id, session.access_token);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else setProfile(null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
