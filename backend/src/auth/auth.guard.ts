import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private config: ConfigService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid authorization header');
        }

        const token = authHeader.split(' ')[1];

        const supabase = createClient(
            this.config.get<string>('SUPABASE_URL')!,
            this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
        );

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        request.user = data.user;
        return true;
    }
}
