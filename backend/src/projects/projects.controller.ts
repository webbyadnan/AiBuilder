import {
    Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
    constructor(private projectsService: ProjectsService) { }

    @Post()
    create(@Request() req: any, @Body() body: { prompt: string; title?: string }) {
        return this.projectsService.createProject(req.user.id, body.prompt, body.title);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.projectsService.getUserProjects(req.user.id);
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.projectsService.getProject(id, req.user.id);
    }

    @Patch(':id')
    update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        return this.projectsService.updateProject(id, req.user.id, body);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.projectsService.deleteProject(id, req.user.id);
    }

    @Get(':id/versions')
    getVersions(@Request() req: any, @Param('id') id: string) {
        return this.projectsService.getVersions(id, req.user.id);
    }

    @Post(':id/versions')
    saveVersion(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: { html_content: string; label?: string },
    ) {
        return this.projectsService.saveVersion(id, req.user.id, body.html_content, body.label);
    }

    @Post(':id/versions/:versionId/restore')
    restore(
        @Request() req: any,
        @Param('id') id: string,
        @Param('versionId') versionId: string,
    ) {
        return this.projectsService.restoreVersion(id, req.user.id, versionId);
    }
}
