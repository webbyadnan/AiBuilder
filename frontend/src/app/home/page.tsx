'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Zap } from 'lucide-react';

export default function HomePage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    const handleBuild = async () => {
        if (!prompt.trim() || !user) return;
        setLoading(true);
        try {
            const project = await api.projects.create({ prompt, title: prompt.slice(0, 60) });
            router.push(`/projects/${project.id}`);
        } catch {
            setLoading(false);
        }
    };

    const examples = [
        'Gym website called GymBoy with black and gold theme',
        'Dental clinic website for Happy Smiles with appointments booking',
        'Portfolio for a full-stack developer with dark mode and projects showcase',
        'Restaurant website for Bella Italia with online menu',
    ];

    return (
        <div style={{ minHeight: '100vh' }}>
            <Navbar />
            <section className="hero-glow" style={{ paddingTop: 80, paddingBottom: 100, textAlign: 'center' }}>
                <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
                    <h1 className="fade-in" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.2rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24 }}>
                        Turn thoughts into{' '}
                        <span style={{ background: 'linear-gradient(135deg, #c4b5fd, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            websites instantly
                        </span>
                        , with AI.
                    </h1>

                    <p className="fade-in fade-in-delay-1" style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: 48, maxWidth: 580, margin: '0 auto 48px' }}>
                        Create, customize and publish websites faster than ever with our AI Site Builder. Powered by Groq &amp; DeepSeek.
                    </p>

                    <div className="fade-in fade-in-delay-3 glass-card" style={{ padding: 20, borderRadius: 20, maxWidth: 740, margin: '0 auto', textAlign: 'left' }}>
                        <textarea
                            className="prompt-box"
                            rows={4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your website in detail..."
                            onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleBuild(); }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>
                                You have <strong style={{ color: '#c4b5fd' }}>{profile?.credits ?? '...'} credits</strong> remaining
                            </span>
                            <button className="btn-primary" onClick={handleBuild} disabled={loading || !prompt.trim()} style={{ opacity: !prompt.trim() ? 0.5 : 1 }}>
                                {loading ? <span className="dot-spinner"><span /><span /><span /></span> : <><Zap size={16} /> Create with AI</>}
                            </button>
                        </div>
                    </div>

                    <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                        {examples.map((ex, i) => (
                            <button key={i} onClick={() => setPrompt(ex)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 50, padding: '6px 14px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; e.currentTarget.style.color = '#c4b5fd'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}>
                                {ex}
                            </button>
                        ))}
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}
