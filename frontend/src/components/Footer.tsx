'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{ borderTop: '1px solid rgba(139,92,246,0.12)', padding: '48px 24px 32px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 32, marginBottom: 40 }}>
                    {/* Brand */}
                    <div style={{ maxWidth: 280 }}>
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 12 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Zap size={18} color="#fff" fill="#fff" />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>AiBuilder</span>
                        </Link>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                            Turn any idea into a stunning website in seconds with the power of AI.
                        </p>
                    </div>

                    {/* Links */}
                    <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
                        <div>
                            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</p>
                            {[{ href: '/', label: 'Home' }, { href: '/community', label: 'Community' }, { href: '/pricing', label: 'Pricing' }, { href: '/projects', label: 'My Projects' }].map(link => (
                                <Link key={link.href} href={link.href} style={{ display: 'block', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: 10, transition: 'color 0.2s' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                        <div>
                            <p style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account</p>
                            {[{ href: '/login', label: 'Login' }, { href: '/signup', label: 'Sign Up' }].map(link => (
                                <Link key={link.href} href={link.href} style={{ display: 'block', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: 10, transition: 'color 0.2s' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
                        © {new Date().getFullYear()} AiBuilder. All rights reserved.
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
                        Crafted with ❤️ by <span style={{ color: '#c4b5fd', fontWeight: 600 }}>Adnan Khan</span>
                    </p>
                </div>
            </div>
        </footer>
    );
}
