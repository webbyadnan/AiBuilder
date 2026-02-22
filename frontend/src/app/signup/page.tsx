'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Zap, Mail, Lock, User, Eye, EyeOff, Github } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const supabase = createClient();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        const { error } = await supabase.auth.signUp({
            email, password,
            options: {
                data: { full_name: fullName },
                emailRedirectTo: `${window.location.origin}/home`
            },
        });
        if (error) { setError(error.message); setLoading(false); return; }
        setSuccess(true);
        setTimeout(() => router.push('/home'), 2000);
    };

    const handleOAuth = async (provider: 'github' | 'google') => {
        await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: `${window.location.origin}/home` },
        });
    };

    if (success) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div className="hero-glow" style={{ position: 'fixed', inset: 0 }} />
                <div className="glass-card" style={{ padding: '48px 36px', textAlign: 'center', maxWidth: 400, zIndex: 1 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Zap size={28} color="#fff" fill="#fff" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>You're in! 🎉</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Account created with <strong style={{ color: '#c4b5fd' }}>5 free credits</strong>. Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div className="hero-glow" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
            <div className="glass-card fade-in" style={{ width: '100%', maxWidth: 420, padding: '40px 36px', zIndex: 1 }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 32, justifyContent: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={20} color="#fff" fill="#fff" />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#fff' }}>AiBuilder</span>
                </Link>

                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6, textAlign: 'center' }}>Create your account</h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', textAlign: 'center', marginBottom: 28 }}>
                    Get <strong style={{ color: '#c4b5fd' }}>5 free credits</strong> to start building
                </p>

                {/* OAuth */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <button onClick={() => handleOAuth('github')} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                        <Github size={18} /> GitHub
                    </button>
                    <button onClick={() => handleOAuth('google')} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" /><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" /><path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z" fill="#FBBC05" /><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z" fill="#EA4335" /></svg>
                        Google
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>or</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                </div>

                <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                            <input className="input-field" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Adnan Khan" required style={{ paddingLeft: 40 }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                            <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required style={{ paddingLeft: 40 }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                            <input className="input-field" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6} style={{ paddingLeft: 40, paddingRight: 40 }} />
                            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && <p style={{ color: '#f87171', fontSize: '0.85rem', background: 'rgba(248,113,113,0.1)', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}

                    <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '13px' }}>
                        {loading ? <span className="dot-spinner"><span /><span /><span /></span> : 'Create Account — Free'}
                    </button>
                </form>

                <p style={{ marginTop: 24, textAlign: 'center', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: '#c4b5fd', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
