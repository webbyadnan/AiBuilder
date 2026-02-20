import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
    constructor(private supabase: SupabaseService) { }

    async getProfile(userId: string) {
        const { data, error } = await this.supabase.db
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    }

    async syncProfile(userId: string, fullName: string, avatarUrl?: string) {
        const { data, error } = await this.supabase.db
            .from('profiles')
            .upsert({ id: userId, full_name: fullName, avatar_url: avatarUrl })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
}
