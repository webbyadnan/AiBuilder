'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';
import { Calendar, Eye, ExternalLink } from 'lucide-react';

interface Project {
    id: string;
    title: string;
    prompt: string;
    thumbnail_url?: string;
    html_content?: string;
    created_at: string;
    profiles: { full_name: string; avatar_url?: string };
}

export default function CommunityPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const router = useRouter();

    const load = async (p = 1) => {
        setLoading(true);
        const data = await api.community.list(p);
        setProjects(data.projects || []);
        setTotal(data.total || 0);
        setLoading(false);
    };

    useEffect(() => { load(page); }, [page]);

    const handlePreview = (project: Project) => {
        router.push(`/preview/${project.id}`);
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const getInitial = (name: string) => name?.[0]?.toUpperCase() || '?';

    return (
        <div style={{ minHeight: '100vh' }}>
            <Navbar />
            <div className="page-glow" style={{ padding: '48px 24px', maxWidth: 1280, margin: '0 auto' }}>
                <div style={{ marginBottom: 40 }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Published Projects</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>{total} websites built by the community</p>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                        {[...Array(9)].map((_, i) => (
                            <div key={i} className="glass-card" style={{ overflow: 'hidden' }}>
                                <div className="skeleton" style={{ height: 200 }} />
                                <div style={{ padding: 20 }}>
                                    <div className="skeleton" style={{ height: 20, marginBottom: 8 }} />
                                    <div className="skeleton" style={{ height: 14, width: '60%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                            {projects.map((project) => (
                                <div key={project.id} className="glass-card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
                                    {/* Preview */}
                                    <div style={{ height: 200, background: 'rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => handlePreview(project)}>
                                        {project.html_content ? (
                                            <iframe
                                                srcDoc={project.html_content}
                                                style={{
                                                    width: '1280px',
                                                    height: '900px',
                                                    transform: 'scale(0.234)',
                                                    transformOrigin: 'top left',
                                                    pointerEvents: 'none',
                                                    border: 'none',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                }}
                                                sandbox="allow-scripts allow-same-origin"
                                            />
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.875rem' }}>No Preview</div>
                                        )}
                                        {/* Hover overlay */}
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', background: 'rgba(0,0,0,0.55)', zIndex: 1 }}
                                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.9)', borderRadius: 8, padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600 }}>
                                                <ExternalLink size={14} /> Open Website
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div style={{ padding: 20 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.4, flex: 1, marginRight: 8 }}>{project.title}</h3>
                                            <span className="tag-badge">Website</span>
                                        </div>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {project.prompt}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem' }}>
                                                <Calendar size={12} /> {formatDate(project.created_at)}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 50, padding: '4px 12px' }}>
                                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                                                    {getInitial(project.profiles?.full_name)}
                                                </div>
                                                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{project.profiles?.full_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {total > 12 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                                {page > 1 && <button className="btn-secondary" onClick={() => setPage(p => p - 1)}>← Previous</button>}
                                <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px', color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>Page {page}</span>
                                {projects.length === 12 && <button className="btn-secondary" onClick={() => setPage(p => p + 1)}>Next →</button>}
                            </div>
                        )}
                    </>
                )}
            </div>
            <Footer />
        </div>
    );
}
