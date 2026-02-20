import {
    Controller, Get, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
    constructor(private adminService: AdminService) { }

    @Get('stats')
    getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    @Get('users')
    getAllUsers(@Query('page') page = '1', @Query('limit') limit = '20') {
        return this.adminService.getAllUsers(+page, +limit);
    }

    @Patch('users/:id/credits')
    updateCredits(@Param('id') id: string, @Body() body: { credits: number }) {
        return this.adminService.updateUserCredits(id, body.credits);
    }

    @Patch('users/:id/ban')
    banUser(@Param('id') id: string, @Body() body: { ban: boolean }) {
        return this.adminService.banUser(id, body.ban);
    }

    @Delete('users/:id')
    deleteUser(@Param('id') id: string) {
        return this.adminService.deleteUser(id);
    }

    @Get('projects')
    getAllProjects(@Query('page') page = '1', @Query('limit') limit = '20') {
        return this.adminService.getAllProjects(+page, +limit);
    }

    @Patch('projects/:id/publish')
    togglePublish(@Param('id') id: string, @Body() body: { is_public: boolean }) {
        return this.adminService.toggleProjectPublic(id, body.is_public);
    }

    @Delete('projects/:id')
    deleteProject(@Param('id') id: string) {
        return this.adminService.deleteProject(id);
    }

    @Get('logs')
    getAiLogs(@Query('page') page = '1', @Query('limit') limit = '50') {
        return this.adminService.getAiLogs(+page, +limit);
    }
}
