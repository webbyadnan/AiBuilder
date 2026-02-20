import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AdminService {
    constructor(private supabase: SupabaseService) { }

    async getDashboardStats() {
        const [usersRes, projectsRes, logsRes] = await Promise.all([
            this.supabase.db.from('profiles').select('id, credits', { count: 'exact' }),
            this.supabase.db.from('projects').select('id', { count: 'exact' }),
            this.supabase.db.from('ai_logs').select('id, success', { count: 'exact' }),
        ]);

        const totalCreditsIssued = usersRes.data?.reduce((sum, p) => sum + (p.credits || 0), 0) || 0;
        const successLogs = logsRes.data?.filter((l) => l.success).length || 0;

        return {
            totalUsers: usersRes.count || 0,
            totalProjects: projectsRes.count || 0,
            totalGenerations: logsRes.count || 0,
            successfulGenerations: successLogs,
            totalCreditsIssued,
        };
    }

    async getAllUsers(page = 1, limit = 20) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await this.supabase.db
            .from('profiles')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { users: data, total: count, page, limit };
    }

    async updateUserCredits(userId: string, credits: number) {
        const { data, error } = await this.supabase.db
            .from('profiles')
            .update({ credits })
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async banUser(userId: string, ban: boolean) {
        const { data, error } = await this.supabase.db
            .from('profiles')
            .update({ is_banned: ban })
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async deleteUser(userId: string) {
        const { error } = await this.supabase.db.auth.admin.deleteUser(userId);
        if (error) throw error;
        return { success: true };
    }

    async getAllProjects(page = 1, limit = 20) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await this.supabase.db
            .from('projects')
            .select('id, title, prompt, is_public, created_at, updated_at, user_id, profiles(full_name)', {
                count: 'exact',
            })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { projects: data, total: count, page, limit };
    }

    async toggleProjectPublic(projectId: string, isPublic: boolean) {
        const { data, error } = await this.supabase.db
            .from('projects')
            .update({ is_public: isPublic })
            .eq('id', projectId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async deleteProject(projectId: string) {
        const { error } = await this.supabase.db.from('projects').delete().eq('id', projectId);
        if (error) throw error;
        return { success: true };
    }

    async getAiLogs(page = 1, limit = 50) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await this.supabase.db
            .from('ai_logs')
            .select('*, profiles(full_name)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { logs: data, total: count, page, limit };
    }
}
