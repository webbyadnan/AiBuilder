import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProjectsService {
    constructor(private supabase: SupabaseService) { }

    async createProject(userId: string, prompt: string, title?: string) {
        const { data, error } = await this.supabase.db
            .from('projects')
            .insert({ user_id: userId, prompt, title: title || 'Untitled Project' })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getUserProjects(userId: string) {
        const { data, error } = await this.supabase.db
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async getProject(projectId: string, userId: string) {
        const { data, error } = await this.supabase.db
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error) throw new NotFoundException('Project not found');
        if (data.user_id !== userId) throw new ForbiddenException('Access denied');
        return data;
    }

    async updateProject(projectId: string, userId: string, updates: Partial<{
        title: string;
        html_content: string;
        is_public: boolean;
        thumbnail_url: string;
    }>) {
        const project = await this.getProject(projectId, userId);
        if (!project) throw new NotFoundException();

        const { data, error } = await this.supabase.db
            .from('projects')
            .update(updates)
            .eq('id', projectId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteProject(projectId: string, userId: string) {
        await this.getProject(projectId, userId);

        const { error } = await this.supabase.db
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;
        return { success: true };
    }

    async getVersions(projectId: string, userId: string) {
        await this.getProject(projectId, userId);

        const { data, error } = await this.supabase.db
            .from('project_versions')
            .select('*')
            .eq('project_id', projectId)
            .order('version_number', { ascending: false });

        if (error) throw error;
        return data;
    }

    async saveVersion(projectId: string, userId: string, htmlContent: string, label?: string) {
        await this.getProject(projectId, userId);

        // Get latest version number
        const { data: versions } = await this.supabase.db
            .from('project_versions')
            .select('version_number')
            .eq('project_id', projectId)
            .order('version_number', { ascending: false })
            .limit(1);

        const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

        const { data, error } = await this.supabase.db
            .from('project_versions')
            .insert({
                project_id: projectId,
                html_content: htmlContent,
                label: label || `Version ${nextVersion}`,
                version_number: nextVersion,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async restoreVersion(projectId: string, userId: string, versionId: string) {
        await this.getProject(projectId, userId);

        const { data: version, error: vError } = await this.supabase.db
            .from('project_versions')
            .select('html_content')
            .eq('id', versionId)
            .single();

        if (vError) throw new NotFoundException('Version not found');

        return this.updateProject(projectId, userId, { html_content: version.html_content });
    }

    async deductCredit(userId: string) {
        const { data: profile } = await this.supabase.db
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (!profile || profile.credits <= 0) {
            throw new ForbiddenException('Insufficient credits');
        }

        const { data, error } = await this.supabase.db
            .from('profiles')
            .update({ credits: profile.credits - 1 })
            .eq('id', userId)
            .select('credits')
            .single();

        if (error) throw error;
        return data;
    }
}
