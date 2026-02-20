import { Controller, Get, Param, Query } from '@nestjs/common';
import { CommunityService } from './community.service';

@Controller('community')
export class CommunityController {
    constructor(private communityService: CommunityService) { }

    @Get()
    getPublicProjects(@Query('page') page = '1', @Query('limit') limit = '12') {
        return this.communityService.getPublicProjects(+page, +limit);
    }

    @Get(':id')
    getPublicProject(@Param('id') id: string) {
        return this.communityService.getPublicProject(id);
    }
}
