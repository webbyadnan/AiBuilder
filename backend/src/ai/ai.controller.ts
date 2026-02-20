import { Controller, Post, Body, UseGuards, Request, Param, Res } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Response } from 'express';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
    constructor(private aiService: AiService) { }

    @Post('generate/:projectId')
    async generate(
        @Request() req: any,
        @Param('projectId') projectId: string,
        @Body() body: { prompt: string },
        @Res() res: Response,
    ) {
        return this.aiService.generateWebsite(req.user.id, projectId, body.prompt, res);
    }

    @Post('edit/:projectId')
    async edit(
        @Request() req: any,
        @Param('projectId') projectId: string,
        @Body() body: { prompt: string; selected_element?: string; current_html: string },
        @Res() res: Response,
    ) {
        return this.aiService.generateWebsite(
            req.user.id,
            projectId,
            body.prompt,
            res,
            true,
            body.selected_element,
            body.current_html,
        );
    }
}
