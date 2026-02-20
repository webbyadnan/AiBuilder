'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function PreviewPage() {
    const { id } = useParams<{ id: string }>();
    const [html, setHtml] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        if (!id) return;
        fetch(`${BACKEND}/api/community/${id}`)
            .then((r) => {
                if (!r.ok) throw new Error('Project not found or not public');
                return r.json();
            })
            .then((data) => {
                if (!data.html_content) throw new Error('No content available');
                setHtml(data.html_content);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#08080f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p>Loading preview...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', background: '#08080f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    <p style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</p>
                    <p style={{ fontWeight: 700, color: '#fff', marginBottom: 8 }}>{error}</p>
                    <a href="/community" style={{ color: '#7c3aed', textDecoration: 'none' }}>← Back to Community</a>
                </div>
            </div>
        );
    }

    // Render the website directly — no iframe, no sandbox restrictions
    return (
        <div
            style={{ width: '100vw', minHeight: '100vh' }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
