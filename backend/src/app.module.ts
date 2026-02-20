import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { CommunityModule } from './community/community.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    ProjectsModule,
    AiModule,
    AdminModule,
    CommunityModule,
  ],
})
export class AppModule { }
