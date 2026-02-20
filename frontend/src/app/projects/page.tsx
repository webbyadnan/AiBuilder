'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Plus, Calendar, Eye, Trash2, FolderOpen, Download, Globe } from 'lucide-react';

interface Project {
    id: string;
    title: string;
    prompt: string;
    html_content: string;
    is_public: boolean;
    thumbnail_url?: string;
    created_at: string;
    updated_at: string;
}

export default function ProjectsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        api.projects.list().then(setProjects).finally(() => setLoading(false));
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this project?')) return;
        setDeleting(id);
        await api.projects.delete(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setDeleting(null);
    };

    const handleDownload = (project: Project) => {
        const blob = new Blob([project.html_content || ''], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${project.title.replace(/\s+/g, '-')}.html`;
        a.click(); URL.revokeObjectURL(url);
    };

    const handlePreview = (project: Project) => {
        const win = window.open('', '_blank');
        if (win) { win.document.write(project.html_content); win.document.close(); }
    };

    const handleTogglePublic = async (project: Project) => {
        await api.projects.update(project.id, { is_public: !project.is_public });
        setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, is_public: !p.is_public } : p));
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div style={{ minHeight: '100vh' }}>
            <Navbar />
            <div className="page-glow" style={{ padding: '48px 24px', maxWidth: 1280, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>My Projects</h1>
                        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button className="btn-primary" onClick={() => router.push('/home')}>
                        <Plus size={18} /> Create New
                    </button>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="glass-card" style={{ overflow: 'hidden' }}>
                                <div className="skeleton" style={{ height: 180 }} />
                                <div style={{ padding: 20 }}>
                                    <div className="skeleton" style={{ height: 20, marginBottom: 8, width: '70%' }} />
                                    <div className="skeleton" style={{ height: 14, width: '90%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <FolderOpen size={32} color="#c4b5fd" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>No projects yet</h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Create your first AI-powered website</p>
                        <button className="btn-primary" onClick={() => router.push('/home')}><Plus size={16} /> Build Something</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                        {projects.map((project) => (
                            <div key={project.id} className="glass-card" style={{ overflow: 'hidden', cursor: 'default' }}>
                                {/* Thumbnail */}
                                <div style={{ height: 180, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                    {project.html_content ? (
                                        <iframe srcDoc={project.html_content} style={{ width: '200%', height: '200%', transform: 'scale(0.5)', transformOrigin: 'top left', pointerEvents: 'none', border: 'none' }} sandbox="allow-scripts" />
                                    ) : (
                                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>No Preview</span>
                                    )}
                                    {project.is_public && (
                                        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 6, padding: '3px 8px', fontSize: '0.7rem', color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Globe size={10} /> Public
                                        </div>
                                    )}
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
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => handlePreview(project)}>
                                                <Eye size={13} /> Preview
                                            </button>
                                            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => router.push(`/projects/${project.id}`)}>
                                                <FolderOpen size={13} /> Open
                                            </button>
                                        </div>
                                    </div>

                                    {/* More actions */}
                                    <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                        <button onClick={() => handleDownload(project)} className="btn-ghost" style={{ flex: 1, fontSize: '0.78rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Download size={13} /> Download
                                        </button>
                                        <button onClick={() => handleTogglePublic(project)} className="btn-ghost" style={{ flex: 1, fontSize: '0.78rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 4, color: project.is_public ? '#4ade80' : 'rgba(255,255,255,0.5)' }}>
                                            <Globe size={13} /> {project.is_public ? 'Unpublish' : 'Publish'}
                                        </button>
                                        <button onClick={() => handleDelete(project.id)} disabled={deleting === project.id} className="btn-ghost" style={{ flex: 1, fontSize: '0.78rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 4, color: '#f87171' }}>
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}
