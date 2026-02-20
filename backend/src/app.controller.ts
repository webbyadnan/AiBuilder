import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return { status: 'ok', service: 'AI Builder API' };
  }

  @Get('health')
  healthCheck() {
    return { status: 'ok', service: 'AI Builder API' };
  }
}
