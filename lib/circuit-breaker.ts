/**
 * Circuit Breaker Implementation for External APIs
 * Protects against cascading failures and provides fallback mechanisms
 */

import { getRedis } from "./redis";

// Circuit breaker states
export enum CircuitState {
    CLOSED = "CLOSED", // Normal operation
    OPEN = "OPEN", // Circuit is open, failing fast
    HALF_OPEN = "HALF_OPEN", // Testing if service has recovered
}

// Circuit breaker configuration
interface CircuitBreakerConfig {
    failureThreshold: number; // Number of failures before opening
    recoveryTimeout: number; // Time to wait before trying again (ms)
    successThreshold: number; // Successes needed to close circuit
    timeout: number; // Request timeout (ms)
    monitoringWindow: number; // Time window for failure counting (ms)
}

// Default configurations for different services
export const CIRCUIT_BREAKER_CONFIGS = {
    OPENFOODFACTS: {
        failureThreshold: 5,
        recoveryTimeout: 30000, // 30 seconds
        successThreshold: 3,
        timeout: 10000, // 10 seconds
        monitoringWindow: 60000, // 1 minute
    },
    SUPABASE: {
        failureThreshold: 3,
        recoveryTimeout: 10000, // 10 seconds
        successThreshold: 2,
        timeout: 5000, // 5 seconds
        monitoringWindow: 30000, // 30 seconds
    },
    GENERAL: {
        failureThreshold: 5,
        recoveryTimeout: 60000, // 1 minute
        successThreshold: 3,
        timeout: 15000, // 15 seconds
        monitoringWindow: 120000, // 2 minutes
    },
} as const;

// Circuit breaker result
interface CircuitBreakerResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    state: CircuitState;
    metrics: {
        failures: number;
        successes: number;
        lastFailure?: number;
        lastSuccess?: number;
    };
}

// Circuit breaker implementation
export class CircuitBreaker {
    private redis = getRedis();
    private readonly serviceName: string;
    private readonly config: CircuitBreakerConfig;

    constructor(serviceName: string, config: CircuitBreakerConfig) {
        this.serviceName = serviceName;
        this.config = config;
    }

    private getKeys(): {
        state: string;
        failures: string;
        successes: string;
        lastFailure: string;
        lastSuccess: string;
        openedAt: string;
    } {
        return {
            state: `circuit:${this.serviceName}:state`,
            failures: `circuit:${this.serviceName}:failures`,
            successes: `circuit:${this.serviceName}:successes`,
            lastFailure: `circuit:${this.serviceName}:last_failure`,
            lastSuccess: `circuit:${this.serviceName}:last_success`,
            openedAt: `circuit:${this.serviceName}:opened_at`,
        };
    }

    async execute<T>(
        operation: () => Promise<T>,
    ): Promise<CircuitBreakerResult<T>> {
        const state = await this.getState();

        // If circuit is open, check if we should try again
        if (state === CircuitState.OPEN) {
            const canRetry = await this.canRetry();
            if (!canRetry) {
                return {
                    success: false,
                    error: "Circuit breaker is OPEN - service unavailable",
                    state: CircuitState.OPEN,
                    metrics: await this.getMetrics(),
                };
            }
            // Move to half-open to test the service
            await this.setState(CircuitState.HALF_OPEN);
        }

        try {
            // Execute with timeout
            const result = await this.executeWithTimeout(operation);

            // Record success
            await this.recordSuccess();

            // If we were half-open and got enough successes, close the circuit
            if (state === CircuitState.HALF_OPEN) {
                const successes = await this.getSuccessCount();
                if (successes >= this.config.successThreshold) {
                    await this.setState(CircuitState.CLOSED);
                    await this.resetCounters();
                }
            }

            return {
                success: true,
                data: result,
                state: await this.getState(),
                metrics: await this.getMetrics(),
            };
        }
        catch (error) {
            // Record failure
            await this.recordFailure();

            // Check if we should open the circuit
            const failures = await this.getFailureCount();
            if (failures >= this.config.failureThreshold) {
                await this.openCircuit();
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                state: await this.getState(),
                metrics: await this.getMetrics(),
            };
        }
    }

    private executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
        return Promise.race([
            operation(),
            new Promise<never>((_, reject) => {
                setTimeout(
                    () => reject(new Error("Operation timeout")),
                    this.config.timeout,
                );
            }),
        ]);
    }

    private async getState(): Promise<CircuitState> {
        if (!this.redis)
            return CircuitState.CLOSED;

        try {
            const state = await this.redis.get(this.getKeys().state);
            return (state as CircuitState) || CircuitState.CLOSED;
        }
        catch {
            return CircuitState.CLOSED;
        }
    }

    private async setState(state: CircuitState): Promise<void> {
        if (!this.redis)
            return;

        try {
            await this.redis.set(this.getKeys().state, state);
            if (state === CircuitState.OPEN) {
                await this.redis.set(this.getKeys().openedAt, Date.now().toString());
            }
        }
        catch (error) {
            console.error("Failed to set circuit state:", error);
        }
    }

    private async canRetry(): Promise<boolean> {
        if (!this.redis)
            return true;

        try {
            const openedAt = await this.redis.get(this.getKeys().openedAt);
            if (!openedAt)
                return true;

            let timeSinceOpened = 0;
            if (typeof openedAt === "string") {
                timeSinceOpened = Date.now() - Number.parseInt(openedAt, 10);
            }
            return timeSinceOpened >= this.config.recoveryTimeout;
        }
        catch {
            return true;
        }
    }

    private async recordSuccess(): Promise<void> {
        if (!this.redis)
            return;

        try {
            const keys = this.getKeys();
            const pipeline = this.redis.pipeline();

            pipeline.incr(keys.successes);
            pipeline.set(keys.lastSuccess, Date.now().toString());
            pipeline.expire(
                keys.successes,
                Math.ceil(this.config.monitoringWindow / 1000),
            );

            await pipeline.exec();
        }
        catch (error) {
            console.error("Failed to record success:", error);
        }
    }

    private async recordFailure(): Promise<void> {
        if (!this.redis)
            return;

        try {
            const keys = this.getKeys();
            const pipeline = this.redis.pipeline();

            pipeline.incr(keys.failures);
            pipeline.set(keys.lastFailure, Date.now().toString());
            pipeline.expire(
                keys.failures,
                Math.ceil(this.config.monitoringWindow / 1000),
            );

            await pipeline.exec();
        }
        catch (error) {
            console.error("Failed to record failure:", error);
        }
    }

    private async openCircuit(): Promise<void> {
        await this.setState(CircuitState.OPEN);
        console.warn(`Circuit breaker OPENED for service: ${this.serviceName}`);
    }

    private async resetCounters(): Promise<void> {
        if (!this.redis)
            return;

        try {
            const keys = this.getKeys();
            await Promise.all([
                this.redis.del(keys.failures),
                this.redis.del(keys.successes),
                this.redis.del(keys.openedAt),
            ]);
        }
        catch (error) {
            console.error("Failed to reset counters:", error);
        }
    }

    private async getFailureCount(): Promise<number> {
        if (!this.redis)
            return 0;

        try {
            const count = await this.redis.get(this.getKeys().failures);
            return typeof count === "string" ? Number.parseInt(count, 10) : 0;
        }
        catch {
            return 0;
        }
    }

    private async getSuccessCount(): Promise<number> {
        if (!this.redis)
            return 0;

        try {
            const count = await this.redis.get(this.getKeys().successes);
            return typeof count === "string" ? Number.parseInt(count, 10) : 0;
        }
        catch {
            return 0;
        }
    }

    async getMetrics() {
        const keys = this.getKeys();

        if (!this.redis) {
            return {
                failures: 0,
                successes: 0,
            };
        }

        try {
            const [failures, successes, lastFailure, lastSuccess] = await Promise.all(
                [
                    this.redis.get(keys.failures),
                    this.redis.get(keys.successes),
                    this.redis.get(keys.lastFailure),
                    this.redis.get(keys.lastSuccess),
                ],
            );

            return {
                failures:
          typeof failures === "string" ? Number.parseInt(failures, 10) : 0,
                successes:
          typeof successes === "string" ? Number.parseInt(successes, 10) : 0,
                lastFailure:
          typeof lastFailure === "string"
              ? Number.parseInt(lastFailure, 10)
              : undefined,
                lastSuccess:
          typeof lastSuccess === "string"
              ? Number.parseInt(lastSuccess, 10)
              : undefined,
            };
        }
        catch {
            return {
                failures: 0,
                successes: 0,
            };
        }
    }

    async getStatus() {
        const state = await this.getState();
        const metrics = await this.getMetrics();

        return {
            serviceName: this.serviceName,
            state,
            config: this.config,
            metrics,
            isHealthy: state === CircuitState.CLOSED,
            canRetry: state === CircuitState.OPEN ? await this.canRetry() : true,
        };
    }

    // Manual controls for emergency situations
    async forceOpen(): Promise<void> {
        await this.setState(CircuitState.OPEN);
        console.warn(
            `Circuit breaker FORCE OPENED for service: ${this.serviceName}`,
        );
    }

    async forceClose(): Promise<void> {
        await this.setState(CircuitState.CLOSED);
        await this.resetCounters();
        console.info(
            `Circuit breaker FORCE CLOSED for service: ${this.serviceName}`,
        );
    }

    async reset(): Promise<void> {
        await this.setState(CircuitState.CLOSED);
        await this.resetCounters();
        console.info(`Circuit breaker RESET for service: ${this.serviceName}`);
    }
}

// Pre-configured circuit breakers for different services
export const circuitBreakers = {
    openFoodFacts: new CircuitBreaker(
        "openfoodfacts",
        CIRCUIT_BREAKER_CONFIGS.OPENFOODFACTS,
    ),
    supabase: new CircuitBreaker("supabase", CIRCUIT_BREAKER_CONFIGS.SUPABASE),
    general: new CircuitBreaker("general", CIRCUIT_BREAKER_CONFIGS.GENERAL),
};

// Circuit breaker manager for monitoring all services
export class CircuitBreakerManager {
    private static instance: CircuitBreakerManager;
    private breakers: Map<string, CircuitBreaker> = new Map();

    static getInstance(): CircuitBreakerManager {
        if (!CircuitBreakerManager.instance) {
            CircuitBreakerManager.instance = new CircuitBreakerManager();
        }
        return CircuitBreakerManager.instance;
    }

    register(name: string, breaker: CircuitBreaker): void {
        this.breakers.set(name, breaker);
    }

    get(name: string): CircuitBreaker | undefined {
        return this.breakers.get(name);
    }

    async getAllStatus() {
        const statuses = await Promise.all(
            Array.from(this.breakers.entries()).map(async ([name, breaker]) => ({
                name,
                status: await breaker.getStatus(),
            })),
        );

        return statuses;
    }

    async getHealthSummary() {
        const statuses = await this.getAllStatus();

        return {
            total: statuses.length,
            healthy: statuses.filter(s => s.status.isHealthy).length,
            open: statuses.filter(s => s.status.state === CircuitState.OPEN).length,
            halfOpen: statuses.filter(
                s => s.status.state === CircuitState.HALF_OPEN,
            ).length,
            services: statuses.reduce(
                (acc, s) => {
                    acc[s.name] = {
                        state: s.status.state,
                        healthy: s.status.isHealthy,
                        failures: s.status.metrics.failures,
                        successes: s.status.metrics.successes,
                    };
                    return acc;
                },
                {} as Record<string, any>,
            ),
        };
    }

    // Emergency controls
    async emergencyOpenAll(): Promise<void> {
        await Promise.all(
            Array.from(this.breakers.values()).map(breaker => breaker.forceOpen()),
        );
        console.error("EMERGENCY: All circuit breakers force opened!");
    }

    async emergencyResetAll(): Promise<void> {
        await Promise.all(
            Array.from(this.breakers.values()).map(breaker => breaker.reset()),
        );
        console.info("EMERGENCY: All circuit breakers reset!");
    }
}

// Initialize the manager and register default breakers
const manager = CircuitBreakerManager.getInstance();
manager.register("openFoodFacts", circuitBreakers.openFoodFacts);
manager.register("supabase", circuitBreakers.supabase);
manager.register("general", circuitBreakers.general);

export { manager as circuitBreakerManager };
