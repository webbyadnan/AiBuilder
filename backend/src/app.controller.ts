import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get(['', 'health', 'api', 'api/health'])
  health() {
    return { status: 'ok', service: 'AI Builder API' };
  }
}
