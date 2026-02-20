'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api, streamGenerate, streamEdit } from '@/lib/api';
import {
    Zap, Monitor, Tablet, Smartphone, Save, Eye, Download, Globe,
    Send, History, X, RotateCcw, ChevronRight, Bot, User2,
} from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; timestamp: Date; }
interface Version { id: string; label: string; version_number: number; created_at: string; }
interface Project { id: string; title: string; prompt: string; html_content: string; is_public: boolean; }

type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<Device, string> = {
    desktop: '100%', tablet: '768px', mobile: '375px',
};

export default function BuilderPage() {
    const { id: projectId } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, profile, refreshProfile } = useAuth();

    const [project, setProject] = useState<Project | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [previewHtml, setPreviewHtml] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [device, setDevice] = useState<Device>('desktop');
    const [versions, setVersions] = useState<Version[]>([]);
    const [showVersions, setShowVersions] = useState(false);
    const [selectedElement, setSelectedElement] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [noCredits, setNoCredits] = useState(false);
    const [editDialog, setEditDialog] = useState<{
        textContent: string; className: string;
        padding: string; margin: string; fontSize: string;
        backgroundColor: string; color: string;
    } | null>(null);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const generatedRef = useRef('');
    const selectedElRef = useRef<HTMLElement | null>(null);

    // Auth guard
    useEffect(() => {
        if (!user) { router.push('/login'); }
    }, [user]);

    // Load chat history from localStorage
    useEffect(() => {
        if (!projectId) return;
        const saved = localStorage.getItem(`chat_${projectId}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
                setMessages(parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
            } catch { }
        }
    }, [projectId]);

    // Save chat history to localStorage on every change
    useEffect(() => {
        if (!projectId || messages.length === 0) return;
        localStorage.setItem(`chat_${projectId}`, JSON.stringify(messages));
    }, [messages, projectId]);

    // Load project
    useEffect(() => {
        if (!user || !projectId) return;
        api.projects.get(projectId).then((p) => {
            setProject(p);
            if (p.html_content) {
                setHtmlContent(p.html_content);
                setPreviewHtml(p.html_content);
            } else {
                // Auto-start generation on first load (only if no saved chat)
                const hasSavedChat = !!localStorage.getItem(`chat_${projectId}`);
                if (!hasSavedChat) {
                    const userMsg: Message = { role: 'user', content: p.prompt, timestamp: new Date() };
                    setMessages([userMsg]);
                    startGeneration(p.prompt);
                }
            }
        });
        api.projects.versions(projectId).then(setVersions);
    }, [user, projectId]);

    // Scroll chat to bottom
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // Element listener is set up via onLoad on the iframe (see below)

    const setupElementListener = useCallback(() => {
        if (!iframeRef.current?.contentDocument) return;
        const doc = iframeRef.current.contentDocument;
        const win = iframeRef.current.contentWindow;
        doc.querySelectorAll('*').forEach((el) => {
            (el as HTMLElement).addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                // Highlight selected element
                doc.querySelectorAll('[data-selected]').forEach((prev) => {
                    (prev as HTMLElement).removeAttribute('data-selected');
                    (prev as HTMLElement).style.outline = '';
                });
                (el as HTMLElement).setAttribute('data-selected', 'true');
                (el as HTMLElement).style.outline = '2px solid #7c3aed';

                // Track reference
                selectedElRef.current = el as HTMLElement;
                const computed = win?.getComputedStyle(el as HTMLElement);
                const tag = el.tagName.toLowerCase();
                const id = el.id ? `#${el.id}` : '';
                const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : '';
                setSelectedElement(`${tag}${id}${cls}`);

                // Open edit dialog with current values
                setEditDialog({
                    textContent: (el as HTMLElement).innerText?.split('\n')[0] ?? '',
                    className: typeof el.className === 'string' ? el.className : '',
                    padding: (el as HTMLElement).style.padding || computed?.paddingTop?.replace('px', '') + 'px' || '0px',
                    margin: (el as HTMLElement).style.margin || '0px',
                    fontSize: (el as HTMLElement).style.fontSize || computed?.fontSize || '16px',
                    backgroundColor: (el as HTMLElement).style.backgroundColor || '',
                    color: (el as HTMLElement).style.color || computed?.color || '',
                });
            });
        });
    }, []);

    const applyElementEdit = async () => {
        if (!selectedElRef.current || !editDialog || !iframeRef.current?.contentDocument) return;
        const el = selectedElRef.current;

        // Apply text content only for leaf elements (no child element nodes)
        if (el.children.length === 0 && editDialog.textContent !== undefined) {
            el.innerText = editDialog.textContent;
        }

        // Apply inline styles
        el.style.padding = editDialog.padding;
        el.style.margin = editDialog.margin;
        el.style.fontSize = editDialog.fontSize;
        if (editDialog.backgroundColor) el.style.backgroundColor = editDialog.backgroundColor;
        if (editDialog.color) el.style.color = editDialog.color;

        // Clear selection highlight before extracting HTML
        el.style.outline = '';
        el.removeAttribute('data-selected');

        // Extract updated HTML from DOM
        const fullHtml = '<!DOCTYPE html>\n' + iframeRef.current.contentDocument.documentElement.outerHTML;
        setHtmlContent(fullHtml);
        setPreviewHtml(fullHtml);
        setEditDialog(null);
        setSelectedElement('');
        selectedElRef.current = null;

        // Auto-save to backend
        try {
            setIsSaving(true);
            await api.projects.update(projectId, { html_content: fullHtml });
        } finally {
            setIsSaving(false);
        }
    };

    const addMessage = (role: 'user' | 'assistant', content: string) => {
        setMessages((prev) => [...prev, { role, content, timestamp: new Date() }]);
    };

    const startGeneration = async (promptText: string) => {
        if ((profile?.credits ?? 0) <= 0) { setNoCredits(true); return; }
        setIsGenerating(true);
        generatedRef.current = '';
        setStatusMsg('Analyzing your request...');

        const assistantPlaceholder: Message = { role: 'assistant', content: '__GENERATING__:0', timestamp: new Date() };
        setMessages((prev) => [...prev, assistantPlaceholder]);

        await streamGenerate(
            projectId,
            promptText,
            (chunk) => {
                generatedRef.current += chunk;
                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'assistant', content: `__GENERATING__:${generatedRef.current.length}`, timestamp: new Date() };
                    return updated;
                });
            },
            (msg) => setStatusMsg(msg),
            async () => {
                setIsGenerating(false);
                setStatusMsg('');
                setHtmlContent(generatedRef.current);
                setPreviewHtml(generatedRef.current);
                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'assistant', content: '✨ Your website is ready! You can see it in the preview. Click any element to select it and request changes.', timestamp: new Date() };
                    return updated;
                });
                const versions = await api.projects.versions(projectId);
                setVersions(versions);
                await refreshProfile();
            },
            (err) => {
                setIsGenerating(false);
                setStatusMsg('');
                addMessage('assistant', `❌ Error: ${err}. Please try again.`);
            },
        );
    };

    const handleSend = async () => {
        if ((profile?.credits ?? 0) <= 0) { setNoCredits(true); return; }
        if (!input.trim() || isGenerating) return;
        const text = input.trim();
        setInput('');
        setSelectedElement('');
        addMessage('user', text);
        setIsGenerating(true);
        generatedRef.current = '';
        setStatusMsg('Analyzing your change request...');

        const assistantPlaceholder: Message = { role: 'assistant', content: '...', timestamp: new Date() };
        setMessages((prev) => [...prev, assistantPlaceholder]);

        await streamEdit(
            projectId, text, htmlContent, selectedElement,
            (chunk) => {
                generatedRef.current += chunk;
            },
            (msg) => setStatusMsg(msg),
            async () => {
                setIsGenerating(false);
                setStatusMsg('');
                setHtmlContent(generatedRef.current);
                setPreviewHtml(generatedRef.current);
                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'assistant', content: '✅ Changes applied! Check the preview.', timestamp: new Date() };
                    return updated;
                });
                const vs = await api.projects.versions(projectId);
                setVersions(vs);
                await refreshProfile();
            },
            (err) => {
                setIsGenerating(false);
                addMessage('assistant', `❌ Error: ${err}`);
            },
        );
    };

    const handleSave = async () => {
        if (!htmlContent) return;
        setIsSaving(true);
        await api.projects.update(projectId, { html_content: htmlContent });
        setIsSaving(false);
    };

    const handleDownload = () => {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${project?.title || 'website'}.html`; a.click();
        URL.revokeObjectURL(url);
    };

    const handlePreview = () => {
        const win = window.open('', '_blank'); if (win) { win.document.write(htmlContent); win.document.close(); }
    };

    const handlePublish = async () => {
        if (!project) return;
        await api.projects.update(projectId, { is_public: !project.is_public });
        setProject((p) => p ? { ...p, is_public: !p.is_public } : p);
    };

    const handleRestoreVersion = async (version: Version) => {
        await api.projects.restoreVersion(projectId, version.id);
        const updated = await api.projects.get(projectId);
        setHtmlContent(updated.html_content);
        setPreviewHtml(updated.html_content);
        // Refresh version list so the drawer stays accurate
        const freshVersions = await api.projects.versions(projectId);
        setVersions(freshVersions);
        setShowVersions(false);
        addMessage('assistant', `🕐 Restored to "${version.label}"`);
    };

    const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB');

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#08080f', overflow: 'hidden' }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 52, borderBottom: '1px solid rgba(139,92,246,0.15)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => router.push('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={14} color="#fff" fill="#fff" />
                        </div>
                    </button>
                    <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
                    <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{project?.title || 'Loading...'}</p>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>Previewing last saved version</p>
                    </div>
                </div>

                {/* Device toggles */}
                <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4 }}>
                    {([['desktop', <Monitor size={16} />], ['tablet', <Tablet size={16} />], ['mobile', <Smartphone size={16} />]] as const).map(([d, icon]) => (
                        <button key={d} onClick={() => setDevice(d)} style={{ background: device === d ? 'rgba(124,58,237,0.4)' : 'transparent', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: device === d ? '#c4b5fd' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>
                            {icon}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 50, padding: '4px 12px', fontSize: '0.78rem', color: '#c4b5fd' }}>
                        <Zap size={12} /> {profile?.credits ?? '...'} credits
                    </div>
                    <button onClick={() => setShowVersions(true)} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                        <History size={15} /> Versions
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '7px 14px' }}>
                        <Save size={15} /> {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={handlePreview} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '7px 14px' }}>
                        <Eye size={15} /> Preview
                    </button>
                    <button onClick={handleDownload} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '7px 14px' }}>
                        <Download size={15} /> Download
                    </button>
                    <button onClick={handlePublish} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '7px 14px' }}>
                        <Globe size={15} /> {project?.is_public ? 'Unpublish' : 'Publish'}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Chat Sidebar */}
                <div style={{ width: 380, borderRight: '1px solid rgba(139,92,246,0.12)', display: 'flex', flexDirection: 'column', background: '#09090f', flexShrink: 0 }}>
                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: msg.role === 'assistant' ? '1px solid rgba(124,58,237,0.4)' : 'none' }}>
                                        {msg.role === 'user' ? <User2 size={14} color="rgba(255,255,255,0.7)" /> : <Bot size={14} color="#fff" />}
                                    </div>
                                    {msg.content.startsWith('__GENERATING__') ? (() => {
                                        const chars = parseInt(msg.content.split(':')[1]) || 0;
                                        const STAGES = [
                                            { icon: '🔍', label: 'Analyzing your vision', threshold: 0 },
                                            { icon: '🏗️', label: 'Building structure', threshold: 3000 },
                                            { icon: '🎨', label: 'Styling & design', threshold: 10000 },
                                            { icon: '✨', label: 'Polishing details', threshold: 18000 },
                                        ];
                                        const activeStage = STAGES.reduce((acc, s) => chars >= s.threshold ? s : acc, STAGES[0]);
                                        const activeIdx = STAGES.indexOf(activeStage);
                                        const progress = Math.min(100, chars > 0 ? Math.round((chars / 25000) * 100) : 2);
                                        return (
                                            <div style={{ flex: 1, maxWidth: '85%', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '16px 16px 16px 4px', padding: '14px 16px', overflow: 'hidden' }}>
                                                {/* Animated shimmer bar */}
                                                <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', marginBottom: 14, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed)', backgroundSize: '200% 100%', borderRadius: 99, transition: 'width 0.4s ease', animation: 'shimmer 1.5s linear infinite' }} />
                                                </div>
                                                {/* Stage pills */}
                                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                                                    {STAGES.map((stage, si) => {
                                                        const isDone = si < activeIdx;
                                                        const isActive = si === activeIdx;
                                                        return (
                                                            <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.3s', background: isDone ? 'rgba(74,222,128,0.12)' : isActive ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isDone ? 'rgba(74,222,128,0.3)' : isActive ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.08)'}`, color: isDone ? '#4ade80' : isActive ? '#c4b5fd' : 'rgba(255,255,255,0.25)' }}>
                                                                <span style={{ fontSize: '0.8rem' }}>{isDone ? '✓' : stage.icon}</span>
                                                                {stage.label}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {/* Current activity */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>
                                                    <span className="dot-spinner"><span /><span /><span /></span>
                                                    <span>{activeStage.label}... <span style={{ color: '#7c3aed', fontWeight: 600 }}>{progress}%</span></span>
                                                </div>
                                            </div>
                                        );
                                    })() : (
                                        <div style={{ maxWidth: '78%', background: msg.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(255,255,255,0.05)', border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.07)' : 'none', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '12px 14px', fontSize: '0.875rem', lineHeight: 1.6 }}>
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                                {!msg.content.startsWith('__GENERATING__') && (
                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', marginTop: 4, marginLeft: msg.role === 'user' ? 0 : 40, marginRight: msg.role === 'user' ? 40 : 0 }}>
                                        {formatTime(msg.timestamp)}
                                    </span>
                                )}
                            </div>
                        ))}
                        {isGenerating && statusMsg && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', padding: '8px 0' }}>
                                <span className="dot-spinner"><span /><span /><span /></span>
                                {statusMsg}
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Selected element indicator */}
                    {selectedElement && (
                        <div style={{ margin: '0 16px 8px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', color: '#c4b5fd' }}>Selected: <code style={{ fontFamily: 'monospace' }}>{selectedElement}</code></span>
                            <button onClick={() => setSelectedElement('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={14} /></button>
                        </div>
                    )}

                    {/* No Credits Banner or Input */}
                    {noCredits ? (
                        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                                <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>⚡</p>
                                <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>You've run out of credits</p>
                                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', marginBottom: 14 }}>Purchase more credits to keep building with AI</p>
                                <Link href="/pricing" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', textDecoration: 'none', fontSize: '0.875rem' }}>
                                    <Zap size={14} /> Buy Credits
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                                <textarea
                                    className="prompt-box"
                                    rows={2}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={selectedElement ? `Change the ${selectedElement}...` : 'Describe your website or request changes...'}
                                    disabled={isGenerating}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                    style={{ flex: 1, fontSize: '0.875rem', padding: '10px 14px', opacity: isGenerating ? 0.5 : 1 }}
                                />
                                <button onClick={handleSend} disabled={isGenerating || !input.trim()} className="btn-primary" style={{ padding: '10px', flexShrink: 0, opacity: isGenerating || !input.trim() ? 0.5 : 1 }}>
                                    <Send size={16} />
                                </button>
                            </div>
                            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>Enter to send · Shift+Enter for newline · 1 credit per generation</p>
                        </div>
                    )}
                </div>

                {/* Preview Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0d0d18', overflow: 'hidden', padding: device !== 'desktop' ? '20px' : '0' }}>
                    {!htmlContent && !isGenerating ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                <Monitor size={32} color="rgba(255,255,255,0.2)" />
                            </div>
                            <p style={{ fontSize: '0.95rem' }}>Analyzing your request...</p>
                            <p style={{ fontSize: '0.8rem', marginTop: 6 }}>This may take around 2-3 minutes...</p>
                        </div>
                    ) : (
                        <div style={{ width: DEVICE_WIDTHS[device], height: '100%', transition: 'width 0.3s ease', boxShadow: device !== 'desktop' ? '0 0 40px rgba(0,0,0,0.5)' : 'none', background: '#fff' }}>
                            <iframe
                                ref={iframeRef}
                                srcDoc={previewHtml || undefined}
                                onLoad={setupElementListener}
                                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                                title="Website Preview"
                            />
                        </div>
                    )}

                    {isGenerating && (
                        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(8,8,15,0.9)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 50, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(10px)', zIndex: 10 }}>
                            <span className="dot-spinner"><span /><span /><span /></span>
                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{statusMsg || 'Building your website...'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Version History Drawer */}
            {
                showVersions && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
                        <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowVersions(false)} />
                        <div className="glass-card" style={{ width: 340, borderRadius: '20px 0 0 20px', border: 'none', borderLeft: '1px solid rgba(139,92,246,0.2)', height: '100%', display: 'flex', flexDirection: 'column', background: '#09090f' }}>
                            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Version History</h3>
                                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{versions.length} versions saved</p>
                                </div>
                                <button onClick={() => setShowVersions(false)} className="btn-ghost" style={{ padding: 8 }}><X size={18} /></button>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                                {versions.map((v, i) => (
                                    <div key={v.id} className="glass-card" style={{ padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v.label}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{formatDate(v.created_at)}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            {v.id === versions[0]?.id && previewHtml === htmlContent && (
                                                <span style={{ fontSize: '0.7rem', color: '#4ade80', background: 'rgba(74,222,128,0.1)', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>Current</span>
                                            )}
                                            <button onClick={() => handleRestoreVersion(v)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <RotateCcw size={12} /> Restore
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Element Edit Dialog */}
            {editDialog && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setEditDialog(null)}>
                    <div className="glass-card" style={{ width: 380, borderRadius: 16, padding: 24, border: '1px solid rgba(124,58,237,0.35)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}
                        onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>Edit Element</h3>
                                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{selectedElement}</p>
                            </div>
                            <button onClick={() => setEditDialog(null)} className="btn-ghost" style={{ padding: 6 }}><X size={16} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* Text Content */}
                            <div>
                                <label style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6 }}>Text Content</label>
                                <textarea rows={2} value={editDialog.textContent}
                                    onChange={(e) => setEditDialog({ ...editDialog, textContent: e.target.value })}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.875rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                            </div>
                            {/* Font Size */}
                            <div>
                                <label style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6 }}>Font Size</label>
                                <input value={editDialog.fontSize}
                                    onChange={(e) => setEditDialog({ ...editDialog, fontSize: e.target.value })}
                                    placeholder="e.g. 16px, 1.5rem"
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            {/* Padding + Margin */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6 }}>Padding</label>
                                    <input value={editDialog.padding}
                                        onChange={(e) => setEditDialog({ ...editDialog, padding: e.target.value })}
                                        placeholder="e.g. 12px"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6 }}>Margin</label>
                                    <input value={editDialog.margin}
                                        onChange={(e) => setEditDialog({ ...editDialog, margin: e.target.value })}
                                        placeholder="e.g. 0px auto"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            </div>
                            {/* Colors */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6 }}>Text Color</label>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input type="color"
                                            value={/^#/.test(editDialog.color) ? editDialog.color : '#ffffff'}
                                            onChange={(e) => setEditDialog({ ...editDialog, color: e.target.value })}
                                            style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', padding: 2, background: 'none' }} />
                                        <input value={editDialog.color}
                                            onChange={(e) => setEditDialog({ ...editDialog, color: e.target.value })}
                                            style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6 }}>Background</label>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input type="color"
                                            value={/^#/.test(editDialog.backgroundColor) ? editDialog.backgroundColor : '#000000'}
                                            onChange={(e) => setEditDialog({ ...editDialog, backgroundColor: e.target.value })}
                                            style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', padding: 2, background: 'none' }} />
                                        <input value={editDialog.backgroundColor}
                                            onChange={(e) => setEditDialog({ ...editDialog, backgroundColor: e.target.value })}
                                            style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                </div>
                            </div>
                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                                <button onClick={() => setEditDialog(null)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                                <button onClick={applyElementEdit} className="btn-primary"
                                    style={{ flex: 2, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {isSaving ? 'Saving...' : '✓ Apply & Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >

    );
}
