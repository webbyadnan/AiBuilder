'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Zap, Star, Globe, Cpu, Layers, BarChart3, ArrowRight, Play } from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuild = async () => {
    if (!prompt.trim()) return;
    if (!user) { router.push('/signup'); return; }
    setLoading(true);
    try {
      const project = await api.projects.create({ prompt, title: prompt.slice(0, 60) });
      router.push(`/projects/${project.id}`);
    } catch {
      setLoading(false);
    }
  };

  const features = [
    { icon: <Cpu size={24} />, title: 'AI-Powered Generation', desc: 'Groq + DeepSeek AI transforms your words into production-quality websites in seconds.' },
    { icon: <Layers size={24} />, title: 'Version History', desc: 'Every change saved automatically. Restore any previous version like a time machine.' },
    { icon: <Globe size={24} />, title: 'Publish & Share', desc: 'Publish to our community gallery. Share your creation with the world.' },
    { icon: <BarChart3 size={24} />, title: 'Element Editing', desc: 'Click any element and describe the change. AI modifies exactly what you want.' },
    { icon: <Star size={24} />, title: 'Production Quality', desc: 'Real content, responsive layouts, animations — never a template, always unique.' },
    { icon: <Zap size={24} />, title: 'Instant Download', desc: 'Download your website as a single HTML file. Deploy anywhere, instantly.' },
  ];

  const examples = [
    'Make a luxury gym website called GymBoy with black and gold theme',
    'Create a dental clinic website for Happy Smiles Dental with appointments',
    'Build a portfolio for a full-stack developer named Sarah with dark mode',
    'Design a restaurant website for Bella Italia with online menu and reservations',
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      {/* Hero Section */}
      <section className="hero-glow" style={{ paddingTop: 80, paddingBottom: 100, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
          {/* Badge */}
          <div className="fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: 50, padding: '6px 16px', marginBottom: 32 }}>
            <span style={{ background: '#7c3aed', borderRadius: 50, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>NEW</span>
            <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Try 5 free credits to start building →</span>
          </div>

          <h1 className="fade-in fade-in-delay-1" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.2rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24 }}>
            Turn thoughts into{' '}
            <span style={{ background: 'linear-gradient(135deg, #c4b5fd, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              websites instantly
            </span>
            , with AI.
          </h1>

          <p className="fade-in fade-in-delay-2" style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: 48, maxWidth: 580, margin: '0 auto 48px' }}>
            Create, customize and publish stunning websites faster than ever with our AI Site Builder. Powered by Groq &amp; DeepSeek.
          </p>

          {/* Prompt Box */}
          <div className="fade-in fade-in-delay-3 glass-card" style={{ padding: 20, borderRadius: 20, maxWidth: 740, margin: '0 auto', textAlign: 'left' }}>
            <textarea
              className="prompt-box"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your website... e.g. 'Make a gym website called GymBoy with black and gold theme, include pricing plans and member testimonials'"
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleBuild(); }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>Ctrl+Enter to build</span>
              <button className="btn-primary" onClick={handleBuild} disabled={loading || !prompt.trim()} style={{ opacity: (!prompt.trim()) ? 0.5 : 1 }}>
                {loading ? (
                  <span className="dot-spinner"><span /><span /><span /></span>
                ) : (
                  <><Zap size={16} /> Create with AI</>
                )}
              </button>
            </div>
          </div>

          {/* Example prompts */}
          <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {examples.map((ex, i) => (
              <button key={i} onClick={() => setPrompt(ex)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 50, padding: '6px 14px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.color = '#c4b5fd'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}>
                {ex.slice(0, 45)}...
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14 }}>Everything you need to build fast</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.05rem' }}>No code required. No design experience needed. Just describe what you want.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {features.map((f, i) => (
            <div key={i} className="glass-card" style={{ padding: 28 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4b5fd', marginBottom: 18 }}>
                {f.icon}
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '1rem' }}>{f.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="glass-card" style={{ padding: '56px 48px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(109,40,217,0.2), rgba(79,70,229,0.1))', border: '1px solid rgba(124,58,237,0.25)' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>Start building for free today</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: '1rem' }}>5 free credits on signup. No credit card required.</p>
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }} onClick={() => router.push(user ? '/home' : '/signup')}>
            <Play size={16} /> Start Building Free <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
