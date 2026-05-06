export declare class CacheService {
    private cache;
    get<T>(key: string): Promise<T | null>;
    set(key: string, data: any, ttlSeconds?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
