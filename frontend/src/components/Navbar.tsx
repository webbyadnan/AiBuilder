'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Zap, Menu, X } from 'lucide-react';

export default function Navbar() {
    const { user, profile, signOut } = useAuth();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : user?.email?.[0]?.toUpperCase() || 'U';

    const navLinks = [
        { href: user ? '/home' : '/', label: 'Home' },
        { href: '/projects', label: 'My Projects' },
        { href: '/community', label: 'Community' },
        { href: '/pricing', label: 'Pricing' },
    ];

    return (
        <nav className="nav-glass sticky top-0 z-50 w-full">
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Logo */}
                <Link href={user ? '/home' : '/'} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={18} color="#fff" fill="#fff" />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.02em' }}>AiBuilder</span>
                </Link>

                {/* Desktop Nav Links */}
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="hidden-mobile">
                    {navLinks.map((link) => (
                        <Link key={link.href} href={link.href} style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', padding: '8px 16px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}>
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Right side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="hidden-mobile">
                    {user ? (
                        <>
                            <div className="credits-badge">
                                <Zap size={14} />
                                Credits: <strong>{profile?.credits ?? '...'}</strong>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <div className="avatar-circle" onClick={() => setProfileOpen(!profileOpen)}>
                                    {initials}
                                </div>
                                {profileOpen && (
                                    <div className="glass-card" style={{ position: 'absolute', right: 0, top: 44, minWidth: 180, padding: '8px', zIndex: 100 }}>
                                        <div style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 4 }}>
                                            {profile?.full_name || user.email}
                                        </div>
                                        <Link href="/projects" className="btn-ghost" style={{ display: 'block', width: '100%', padding: '10px 12px', fontSize: '0.875rem', textDecoration: 'none' }} onClick={() => setProfileOpen(false)}>My Projects</Link>
                                        {profile?.role === 'admin' && (
                                            <Link href="/admin" className="btn-ghost" style={{ display: 'block', width: '100%', padding: '10px 12px', fontSize: '0.875rem', textDecoration: 'none', color: '#c4b5fd' }} onClick={() => setProfileOpen(false)}>Admin Panel</Link>
                                        )}
                                        <Link href="/pricing" className="btn-ghost" style={{ display: 'block', width: '100%', padding: '10px 12px', fontSize: '0.875rem', textDecoration: 'none' }} onClick={() => setProfileOpen(false)}>Buy Credits</Link>
                                        <button onClick={() => { signOut(); setProfileOpen(false); router.push('/'); }} className="btn-ghost" style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: '0.875rem', color: '#f87171' }}>Sign Out</button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <button className="btn-primary" onClick={() => router.push('/signup')}>Get Started</button>
                    )}
                </div>

                {/* Mobile hamburger */}
                <button className="btn-ghost" style={{ display: 'none' }} id="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="nav-glass" style={{ padding: '16px 24px 24px', borderTop: '1px solid rgba(139,92,246,0.12)' }}>
                    {navLinks.map((link) => (
                        <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                            style={{ display: 'block', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', padding: '12px 0', fontSize: '1rem', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {link.label}
                        </Link>
                    ))}
                    <div style={{ marginTop: 16 }}>
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className="credits-badge"><Zap size={14} />Credits: {profile?.credits ?? '...'}</div>
                                <button onClick={() => { signOut(); setMobileOpen(false); router.push('/'); }} className="btn-ghost" style={{ color: '#f87171' }}>Sign Out</button>
                            </div>
                        ) : (
                            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { router.push('/signup'); setMobileOpen(false); }}>Get Started</button>
                        )}
                    </div>
                </div>
            )}

            <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
        </nav>
    );
}
