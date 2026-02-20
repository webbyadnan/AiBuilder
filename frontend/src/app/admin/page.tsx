'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Users, FolderOpen, Zap, Activity, Trash2, Globe, XCircle, Plus, Minus, ChevronDown } from 'lucide-react';

interface Stats { totalUsers: number; totalProjects: number; totalGenerations: number; creditsIssued: number; }
interface AdminUser { id: string; full_name: string; email: string; credits: number; role: string; is_banned?: boolean; created_at: string; }
interface AdminProject { id: string; title: string; prompt: string; is_public: boolean; created_at: string; profiles: { full_name: string }; }
interface Log { id: string; action: string; prompt: string; created_at: string; profiles: { full_name: string }; }

type Tab = 'dashboard' | 'users' | 'projects' | 'logs';

export default function AdminPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [tab, setTab] = useState<Tab>('dashboard');
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [projects, setProjects] = useState<AdminProject[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        if (profile && profile.role !== 'admin') { router.push('/home'); }
    }, [user, profile]);

    useEffect(() => {
        if (!profile || profile.role !== 'admin') return;
        if (tab === 'dashboard') { api.admin.stats().then(setStats); }
        else if (tab === 'users') { setLoading(true); api.admin.users().then((d) => setUsers(d?.users || [])).finally(() => setLoading(false)); }
        else if (tab === 'projects') { setLoading(true); api.admin.projects().then((d) => setProjects(d?.projects || [])).finally(() => setLoading(false)); }
        else if (tab === 'logs') { setLoading(true); api.admin.logs().then((d) => setLogs(d?.logs || [])).finally(() => setLoading(false)); }
    }, [tab, profile]);

    const handleAdjustCredits = async (userId: string, delta: number) => {
        const u = users.find((u) => u.id === userId);
        if (!u) return;
        await api.admin.updateCredits(userId, u.credits + delta);
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, credits: u.credits + delta } : u));
    };

    const handleBan = async (userId: string, ban: boolean) => {
        await api.admin.banUser(userId, ban);
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_banned: ban } : u));
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Delete this user permanently?')) return;
        await api.admin.deleteUser(userId);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
    };

    const handleTogglePublish = async (projectId: string, is_public: boolean) => {
        await api.admin.togglePublish(projectId, !is_public);
        setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, is_public: !is_public } : p));
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm('Delete this project?')) return;
        await api.admin.deleteProject(projectId);
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
    };

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers ?? '-', icon: <Users size={22} />, color: '#7c3aed' },
        { label: 'Total Projects', value: stats?.totalProjects ?? '-', icon: <FolderOpen size={22} />, color: '#4f46e5' },
        { label: 'AI Generations', value: stats?.totalGenerations ?? '-', icon: <Activity size={22} />, color: '#0ea5e9' },
        { label: 'Credits Issued', value: stats?.creditsIssued ?? '-', icon: <Zap size={22} />, color: '#a855f7' },
    ];

    const tabs: { key: Tab; label: string }[] = [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'users', label: 'Users' },
        { key: 'projects', label: 'Projects' },
        { key: 'logs', label: 'AI Logs' },
    ];

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB');

    return (
        <div style={{ minHeight: '100vh', background: '#08080f' }}>
            {/* Admin Nav */}
            <nav style={{ borderBottom: '1px solid rgba(139,92,246,0.15)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={16} color="#fff" fill="#fff" />
                    </div>
                    <span style={{ fontWeight: 800, color: '#fff' }}>AiBuilder</span>
                    <span style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 6, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#c4b5fd' }}>ADMIN</span>
                </div>
                <Link href="/home" className="btn-ghost" style={{ fontSize: '0.85rem', textDecoration: 'none' }}>← Back to App</Link>
            </nav>

            <div style={{ display: 'flex', maxWidth: 1400, margin: '0 auto', padding: 24, gap: 24 }}>
                {/* Sidebar */}
                <div style={{ width: 220, flexShrink: 0 }}>
                    <div className="glass-card" style={{ padding: '8px' }}>
                        {tabs.map((t) => (
                            <button key={t.key} onClick={() => setTab(t.key)} style={{ display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left', background: tab === t.key ? 'rgba(124,58,237,0.2)' : 'transparent', border: 'none', borderRadius: 8, color: tab === t.key ? '#c4b5fd' : 'rgba(255,255,255,0.5)', fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s', marginBottom: 2 }}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main */}
                <div style={{ flex: 1 }}>
                    {/* Dashboard */}
                    {tab === 'dashboard' && (
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24 }}>Dashboard Overview</h1>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
                                {statCards.map((s) => (
                                    <div key={s.label} className="glass-card" style={{ padding: '24px' }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}25`, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, marginBottom: 16 }}>
                                            {s.icon}
                                        </div>
                                        <p style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 4 }}>{s.value}</p>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Users */}
                    {tab === 'users' && (
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24 }}>User Management</h1>
                            <div className="glass-card" style={{ overflow: 'hidden' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Role</th>
                                            <th>Credits</th>
                                            <th>Joined</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? [...Array(5)].map((_, i) => (
                                            <tr key={i}><td colSpan={6}><div className="skeleton" style={{ height: 20 }} /></td></tr>
                                        )) : users.map((u) => (
                                            <tr key={u.id}>
                                                <td>
                                                    <p style={{ fontWeight: 600 }}>{u.full_name}</p>
                                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>{u.email}</p>
                                                </td>
                                                <td><span style={{ background: u.role === 'admin' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 10px', fontSize: '0.75rem', color: u.role === 'admin' ? '#c4b5fd' : 'rgba(255,255,255,0.5)' }}>{u.role}</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <button onClick={() => handleAdjustCredits(u.id, -5)} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#f87171', fontSize: '0.75rem' }}><Minus size={12} /></button>
                                                        <span style={{ fontWeight: 600, minWidth: 28, textAlign: 'center' }}>{u.credits}</span>
                                                        <button onClick={() => handleAdjustCredits(u.id, 5)} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#4ade80', fontSize: '0.75rem' }}><Plus size={12} /></button>
                                                    </div>
                                                </td>
                                                <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{formatDate(u.created_at)}</td>
                                                <td>
                                                    <span style={{ background: u.is_banned ? 'rgba(248,113,113,0.15)' : 'rgba(74,222,128,0.15)', color: u.is_banned ? '#fca5a5' : '#4ade80', borderRadius: 6, padding: '3px 10px', fontSize: '0.75rem' }}>
                                                        {u.is_banned ? 'Banned' : 'Active'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button onClick={() => handleBan(u.id, !u.is_banned)} className="btn-ghost" style={{ fontSize: '0.78rem', color: u.is_banned ? '#4ade80' : '#fbbf24', padding: '5px 8px' }}>
                                                            <XCircle size={13} />
                                                        </button>
                                                        <button onClick={() => handleDeleteUser(u.id)} className="btn-ghost" style={{ fontSize: '0.78rem', color: '#f87171', padding: '5px 8px' }}>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Projects */}
                    {tab === 'projects' && (
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24 }}>Project Management</h1>
                            <div className="glass-card" style={{ overflow: 'hidden' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Project</th>
                                            <th>Author</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? [...Array(5)].map((_, i) => (
                                            <tr key={i}><td colSpan={5}><div className="skeleton" style={{ height: 20 }} /></td></tr>
                                        )) : projects.map((p) => (
                                            <tr key={p.id}>
                                                <td>
                                                    <p style={{ fontWeight: 600 }}>{p.title}</p>
                                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: 2 }}>{p.prompt?.slice(0, 60)}...</p>
                                                </td>
                                                <td style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>{p.profiles?.full_name}</td>
                                                <td>
                                                    <span style={{ background: p.is_public ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)', color: p.is_public ? '#4ade80' : 'rgba(255,255,255,0.4)', borderRadius: 6, padding: '3px 10px', fontSize: '0.75rem' }}>
                                                        {p.is_public ? 'Public' : 'Private'}
                                                    </span>
                                                </td>
                                                <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{formatDate(p.created_at)}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button onClick={() => handleTogglePublish(p.id, p.is_public)} className="btn-ghost" style={{ fontSize: '0.78rem', color: '#60a5fa', padding: '5px 8px' }}>
                                                            <Globe size={13} />
                                                        </button>
                                                        <button onClick={() => handleDeleteProject(p.id)} className="btn-ghost" style={{ fontSize: '0.78rem', color: '#f87171', padding: '5px 8px' }}>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Logs */}
                    {tab === 'logs' && (
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24 }}>AI Generation Logs</h1>
                            <div className="glass-card" style={{ overflow: 'hidden' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Action</th>
                                            <th>Prompt</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? [...Array(8)].map((_, i) => (
                                            <tr key={i}><td colSpan={4}><div className="skeleton" style={{ height: 20 }} /></td></tr>
                                        )) : logs.map((log) => (
                                            <tr key={log.id}>
                                                <td style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>{log.profiles?.full_name}</td>
                                                <td>
                                                    <span style={{ background: log.action === 'generate' ? 'rgba(124,58,237,0.2)' : 'rgba(14,165,233,0.2)', color: log.action === 'generate' ? '#c4b5fd' : '#38bdf8', borderRadius: 6, padding: '3px 10px', fontSize: '0.75rem' }}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', maxWidth: 350 }}>
                                                    {log.prompt?.slice(0, 80)}{log.prompt?.length > 80 ? '...' : ''}
                                                </td>
                                                <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>{formatDate(log.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
