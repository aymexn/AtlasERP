export declare class HealthController {
    private readonly startTime;
    check(): {
        status: string;
        uptime: number;
        timestamp: string;
        service: string;
    };
}
