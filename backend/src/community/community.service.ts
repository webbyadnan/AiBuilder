import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CommunityService {
    constructor(private supabase: SupabaseService) { }

    async getPublicProjects(page = 1, limit = 12) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await this.supabase.db
            .from('projects')
            .select('id, title, prompt, thumbnail_url, html_content, created_at, user_id, profiles(full_name, avatar_url)', {
                count: 'exact',
            })
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { projects: data, total: count, page, limit };
    }

    async getPublicProject(projectId: string) {
        const { data, error } = await this.supabase.db
            .from('projects')
            .select('id, title, prompt, html_content, thumbnail_url, created_at, profiles(full_name, avatar_url)')
            .eq('id', projectId)
            .eq('is_public', true)
            .single();

        if (error) throw error;
        return data;
    }
}
