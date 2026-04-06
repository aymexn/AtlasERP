import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
    private readonly startTime = Date.now();

    @Get()
    check() {
        return {
            status: 'ok',
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            timestamp: new Date().toISOString(),
            service: 'AtlasERP Backend',
        };
    }
}
