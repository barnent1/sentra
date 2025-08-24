import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export class MetricsManager {
    private register: client.Registry;
    private httpRequestDuration: client.Histogram<string>;
    private httpRequestTotal: client.Counter<string>;
    private httpRequestSize: client.Histogram<string>;
    private httpResponseSize: client.Histogram<string>;
    private activeConnections: client.Gauge<string>;

    constructor() {
        this.register = new client.Registry();
        
        // Add default metrics (memory usage, GC, etc.)
        client.collectDefaultMetrics({ 
            register: this.register,
            prefix: 'sentra_api_gateway_',
        });

        this.initializeMetrics();
    }

    private initializeMetrics(): void {
        // HTTP request duration histogram
        this.httpRequestDuration = new client.Histogram({
            name: 'sentra_api_gateway_http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.5, 1, 2, 5, 10],
            registers: [this.register],
        });

        // HTTP request total counter
        this.httpRequestTotal = new client.Counter({
            name: 'sentra_api_gateway_http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.register],
        });

        // HTTP request size histogram
        this.httpRequestSize = new client.Histogram({
            name: 'sentra_api_gateway_http_request_size_bytes',
            help: 'Size of HTTP requests in bytes',
            labelNames: ['method', 'route'],
            buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
            registers: [this.register],
        });

        // HTTP response size histogram
        this.httpResponseSize = new client.Histogram({
            name: 'sentra_api_gateway_http_response_size_bytes',
            help: 'Size of HTTP responses in bytes',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
            registers: [this.register],
        });

        // Active connections gauge
        this.activeConnections = new client.Gauge({
            name: 'sentra_api_gateway_active_connections',
            help: 'Number of active connections',
            registers: [this.register],
        });
    }

    async initialize(): Promise<void> {
        logger.info('Metrics manager initialized');
    }

    collectHttpMetrics() {
        return (req: Request, res: Response, next: NextFunction): void => {
            const startTime = Date.now();
            
            // Increment active connections
            this.activeConnections.inc();

            // Record request size
            const requestSize = parseInt(req.get('content-length') || '0', 10);
            this.httpRequestSize.observe(
                { method: req.method, route: req.route?.path || req.path },
                requestSize
            );

            // Override res.end to capture response metrics
            const originalEnd = res.end;
            res.end = (...args: any[]) => {
                // Calculate duration
                const duration = (Date.now() - startTime) / 1000;
                
                const labels = {
                    method: req.method,
                    route: req.route?.path || req.path,
                    status_code: res.statusCode.toString(),
                };

                // Record metrics
                this.httpRequestDuration.observe(labels, duration);
                this.httpRequestTotal.inc(labels);

                // Record response size
                const responseSize = parseInt(res.get('content-length') || '0', 10);
                this.httpResponseSize.observe(labels, responseSize);

                // Decrement active connections
                this.activeConnections.dec();

                // Call original end method
                originalEnd.apply(res, args);
            };

            next();
        };
    }

    getMetrics(): string {
        return this.register.metrics();
    }

    getContentType(): string {
        return this.register.contentType;
    }

    // Custom metrics for business logic
    recordAgentTaskDuration(agentType: string, duration: number): void {
        // TODO: Implement agent-specific metrics
    }

    recordContextOperation(operation: string, success: boolean): void {
        // TODO: Implement context operation metrics
    }
}