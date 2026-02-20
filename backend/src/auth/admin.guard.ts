import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private config: ConfigService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing authorization header');
        }

        const token = authHeader.split(' ')[1];

        const supabase = createClient(
            this.config.get<string>('SUPABASE_URL')!,
            this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
        );

        const { data: userData, error } = await supabase.auth.getUser(token);
        if (error || !userData.user) throw new UnauthorizedException('Invalid token');

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userData.user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }

        request.user = userData.user;
        return true;
    }
}
