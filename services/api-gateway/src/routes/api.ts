import { Router } from 'express';

const router = Router();

// Basic API info endpoint
router.get('/', (req, res) => {
    res.json({
        name: 'SENTRA API Gateway',
        version: '1.0.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        endpoints: {
            agents: '/api/v1/agents',
            contexts: '/api/v1/contexts',
            quality: '/api/v1/quality',
            timeline: '/api/v1/timeline',
        },
    });
});

export default router;