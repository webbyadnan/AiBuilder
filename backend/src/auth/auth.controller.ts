import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Get('profile')
    @UseGuards(AuthGuard)
    async getProfile(@Request() req: any) {
        return this.authService.getProfile(req.user.id);
    }
}
