const express = require('express');
const axios = require('axios');
const { createClient } = require('redis');

const app = express();
const port = process.env.PORT || 8080;
const checkInterval = parseInt(process.env.CHECK_INTERVAL) || 30;

// Parse services from environment variable
const servicesConfig = process.env.SERVICES ? 
  process.env.SERVICES.trim().split('\n').map(line => {
    const [name, url] = line.trim().split(':');
    return { name, url: url.replace(/^http:\/\//, 'http://') };
  }).filter(service => service.name && service.url) : [];

console.log('Configured services:', servicesConfig);

let healthStatus = {
  services: {},
  lastCheck: null,
  overallStatus: 'unknown'
};

// Redis client for caching health status
let redisClient;
const initRedis = async () => {
  try {
    if (process.env.REDIS_URL) {
      redisClient = createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();
      console.log('Connected to Redis for health status caching');
    }
  } catch (error) {
    console.log('Redis not available, using in-memory storage');
  }
};

// Health check function
const checkServiceHealth = async (service) => {
  const startTime = Date.now();
  try {
    const response = await axios.get(service.url, {
      timeout: 5000,
      validateStatus: (status) => status < 500 // Accept 4xx as healthy
    });
    
    const responseTime = Date.now() - startTime;
    return {
      status: 'healthy',
      responseTime,
      statusCode: response.status,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'unhealthy',
      responseTime,
      error: error.message,
      lastCheck: new Date().toISOString()
    };
  }
};

// Check all services
const checkAllServices = async () => {
  console.log(`Checking health of ${servicesConfig.length} services...`);
  
  const checks = servicesConfig.map(async (service) => {
    const result = await checkServiceHealth(service);
    return { name: service.name, ...result };
  });
  
  const results = await Promise.all(checks);
  
  // Update health status
  healthStatus.lastCheck = new Date().toISOString();
  healthStatus.services = {};
  
  let healthyCount = 0;
  results.forEach(result => {
    healthStatus.services[result.name] = {
      status: result.status,
      responseTime: result.responseTime,
      statusCode: result.statusCode,
      error: result.error,
      lastCheck: result.lastCheck
    };
    
    if (result.status === 'healthy') {
      healthyCount++;
    }
  });
  
  // Calculate overall status
  if (healthyCount === results.length) {
    healthStatus.overallStatus = 'healthy';
  } else if (healthyCount === 0) {
    healthStatus.overallStatus = 'unhealthy';
  } else {
    healthStatus.overallStatus = 'degraded';
  }
  
  console.log(`Health check complete: ${healthyCount}/${results.length} services healthy`);
  
  // Cache status in Redis if available
  if (redisClient) {
    try {
      await redisClient.setex('sentra:health:status', 60, JSON.stringify(healthStatus));
    } catch (error) {
      console.error('Failed to cache health status:', error.message);
    }
  }
};

// Routes
app.use(express.json());

// Health endpoint for this service
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'healthcheck',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Overall system health
app.get('/status', (req, res) => {
  res.json(healthStatus);
});

// Individual service health
app.get('/status/:service', (req, res) => {
  const serviceName = req.params.service;
  const service = healthStatus.services[serviceName];
  
  if (!service) {
    return res.status(404).json({
      error: 'Service not found',
      availableServices: Object.keys(healthStatus.services)
    });
  }
  
  res.json({
    service: serviceName,
    ...service
  });
});

// Health summary endpoint
app.get('/summary', (req, res) => {
  const summary = {
    overallStatus: healthStatus.overallStatus,
    lastCheck: healthStatus.lastCheck,
    serviceCount: Object.keys(healthStatus.services).length,
    healthyServices: Object.values(healthStatus.services).filter(s => s.status === 'healthy').length,
    unhealthyServices: Object.values(healthStatus.services).filter(s => s.status === 'unhealthy').length,
    averageResponseTime: Object.values(healthStatus.services)
      .filter(s => s.responseTime)
      .reduce((sum, s, _, arr) => sum + s.responseTime / arr.length, 0)
  };
  
  res.json(summary);
});

// Metrics endpoint for Prometheus
app.get('/metrics', (req, res) => {
  let metrics = '';
  
  // Overall status metric
  const statusValue = healthStatus.overallStatus === 'healthy' ? 1 : 
                     healthStatus.overallStatus === 'degraded' ? 0.5 : 0;
  metrics += `sentra_overall_health{status="${healthStatus.overallStatus}"} ${statusValue}\n`;
  
  // Individual service metrics
  Object.entries(healthStatus.services).forEach(([name, service]) => {
    const healthValue = service.status === 'healthy' ? 1 : 0;
    metrics += `sentra_service_health{service="${name}",status="${service.status}"} ${healthValue}\n`;
    
    if (service.responseTime) {
      metrics += `sentra_service_response_time_ms{service="${name}"} ${service.responseTime}\n`;
    }
  });
  
  // Service counts
  const serviceCount = Object.keys(healthStatus.services).length;
  const healthyCount = Object.values(healthStatus.services).filter(s => s.status === 'healthy').length;
  
  metrics += `sentra_total_services ${serviceCount}\n`;
  metrics += `sentra_healthy_services ${healthyCount}\n`;
  metrics += `sentra_unhealthy_services ${serviceCount - healthyCount}\n`;
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// Trigger immediate health check
app.post('/check', async (req, res) => {
  try {
    await checkAllServices();
    res.json({
      message: 'Health check triggered',
      status: healthStatus.overallStatus,
      timestamp: healthStatus.lastCheck
    });
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

// Start server
const startServer = async () => {
  await initRedis();
  
  // Initial health check
  if (servicesConfig.length > 0) {
    await checkAllServices();
    
    // Set up periodic health checks
    setInterval(checkAllServices, checkInterval * 1000);
    console.log(`Health checks scheduled every ${checkInterval} seconds`);
  } else {
    console.warn('No services configured for health checking');
  }
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`SENTRA Health Check Service running on port ${port}`);
    console.log(`Services being monitored: ${servicesConfig.map(s => s.name).join(', ')}`);
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  if (redisClient) {
    await redisClient.quit();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (redisClient) {
    await redisClient.quit();
  }
  process.exit(0);
});

startServer().catch(console.error);