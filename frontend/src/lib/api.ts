import { createClient } from './supabase/client';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

async function getAuthHeader(): Promise<Record<string, string>> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return {};
    return { Authorization: `Bearer ${session.access_token}` };
}

async function apiFetch(path: string, options: RequestInit = {}) {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/api${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...headers, ...options.headers },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message || 'Request failed');
    }
    return res.json();
}

// Projects
export const api = {
    projects: {
        create: (data: { prompt: string; title?: string }) =>
            apiFetch('/projects', { method: 'POST', body: JSON.stringify(data) }),
        list: () => apiFetch('/projects'),
        get: (id: string) => apiFetch(`/projects/${id}`),
        update: (id: string, data: any) =>
            apiFetch(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: string) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),
        versions: (id: string) => apiFetch(`/projects/${id}/versions`),
        restoreVersion: (id: string, versionId: string) =>
            apiFetch(`/projects/${id}/versions/${versionId}/restore`, { method: 'POST' }),
    },
    auth: {
        profile: () => apiFetch('/auth/profile'),
    },
    community: {
        list: (page = 1) => apiFetch(`/community?page=${page}`),
        get: (id: string) => apiFetch(`/community/${id}`),
    },
    admin: {
        stats: () => apiFetch('/admin/stats'),
        users: (page = 1) => apiFetch(`/admin/users?page=${page}`),
        updateCredits: (id: string, credits: number) =>
            apiFetch(`/admin/users/${id}/credits`, { method: 'PATCH', body: JSON.stringify({ credits }) }),
        banUser: (id: string, ban: boolean) =>
            apiFetch(`/admin/users/${id}/ban`, { method: 'PATCH', body: JSON.stringify({ ban }) }),
        deleteUser: (id: string) => apiFetch(`/admin/users/${id}`, { method: 'DELETE' }),
        projects: (page = 1) => apiFetch(`/admin/projects?page=${page}`),
        togglePublish: (id: string, is_public: boolean) =>
            apiFetch(`/admin/projects/${id}/publish`, { method: 'PATCH', body: JSON.stringify({ is_public }) }),
        deleteProject: (id: string) => apiFetch(`/admin/projects/${id}`, { method: 'DELETE' }),
        logs: (page = 1) => apiFetch(`/admin/logs?page=${page}`),
    },
};

// SSE streaming for AI generation
export async function streamGenerate(
    projectId: string,
    prompt: string,
    onChunk: (html: string) => void,
    onStatus: (msg: string) => void,
    onDone: () => void,
    onError: (msg: string) => void,
) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(`${BASE_URL}/api/ai/generate/${projectId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ prompt }),
    });

    if (!res.ok || !res.body) {
        onError('Failed to connect to AI service');
        return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.content) onChunk(parsed.content);
                    if (parsed.message) onStatus(parsed.message);
                    if (parsed.projectId) onDone();
                    if (parsed.message && line.includes('"error"')) onError(parsed.message);
                } catch { }
            }
        }
    }
}

export async function streamEdit(
    projectId: string,
    prompt: string,
    currentHtml: string,
    selectedElement: string,
    onChunk: (html: string) => void,
    onStatus: (msg: string) => void,
    onDone: () => void,
    onError: (msg: string) => void,
) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(`${BASE_URL}/api/ai/edit/${projectId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ prompt, current_html: currentHtml, selected_element: selectedElement }),
    });

    if (!res.ok || !res.body) { onError('Failed to connect to AI service'); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.content) onChunk(parsed.content);
                    if (parsed.message) onStatus(parsed.message);
                    if (parsed.projectId) onDone();
                } catch { }
            }
        }
    }
}
