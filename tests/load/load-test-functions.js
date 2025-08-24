// SENTRA Load Testing Helper Functions
// Artillery processor functions for advanced load testing scenarios

const crypto = require('crypto');

// Authentication helper
function authenticate(context, events, done) {
  // Generate random test user credentials
  const testEmail = `loadtest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@sentra.com`;
  const testPassword = 'LoadTest123!';
  
  context.vars.email = testEmail;
  context.vars.password = testPassword;
  
  // Mock authentication token for load testing
  const mockToken = crypto.randomBytes(32).toString('hex');
  context.vars.authToken = mockToken;
  context.vars.userId = `user_${Math.random().toString(36).substr(2, 9)}`;
  
  return done();
}

// Generate random project data
function generateProjectData(context, events, done) {
  const projectNames = [
    'E-commerce Platform',
    'Social Media App',
    'Data Analytics Dashboard',
    'Mobile Banking App',
    'IoT Management System',
    'Content Management System',
    'Real-time Chat Application',
    'Video Streaming Service',
    'Machine Learning Pipeline',
    'Blockchain Network'
  ];
  
  const languages = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'php'];
  const frameworks = ['react', 'vue', 'angular', 'express', 'fastapi', 'spring', 'django'];
  
  context.vars.projectName = projectNames[Math.floor(Math.random() * projectNames.length)];
  context.vars.language = languages[Math.floor(Math.random() * languages.length)];
  context.vars.framework = frameworks[Math.floor(Math.random() * frameworks.length)];
  context.vars.projectId = `proj_${crypto.randomBytes(8).toString('hex')}`;
  
  return done();
}

// Generate agent task data
function generateAgentTaskData(context, events, done) {
  const agentTypes = [
    'code-analyzer',
    'code-reviewer',
    'test-automator',
    'documentation-generator',
    'security-scanner',
    'performance-optimizer'
  ];
  
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const analysisTypes = ['quick', 'standard', 'comprehensive', 'security', 'performance'];
  
  context.vars.agentType = agentTypes[Math.floor(Math.random() * agentTypes.length)];
  context.vars.priority = priorities[Math.floor(Math.random() * priorities.length)];
  context.vars.analysisType = analysisTypes[Math.floor(Math.random() * analysisTypes.length)];
  context.vars.taskId = `task_${crypto.randomBytes(8).toString('hex')}`;
  
  return done();
}

// Simulate realistic user behavior
function simulateUserDelay(context, events, done) {
  // Add realistic delays between requests (human-like behavior)
  const delays = [100, 250, 500, 750, 1000, 1500, 2000];
  const delay = delays[Math.floor(Math.random() * delays.length)];
  
  setTimeout(() => {
    done();
  }, delay);
}

// Generate realistic file upload data
function generateFileData(context, events, done) {
  const fileTypes = ['.js', '.ts', '.py', '.java', '.go', '.rs', '.php', '.rb'];
  const fileSizes = [1024, 2048, 4096, 8192, 16384, 32768]; // bytes
  
  const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
  const fileSize = fileSizes[Math.floor(Math.random() * fileSizes.length)];
  
  context.vars.fileName = `test-file-${Date.now()}${fileType}`;
  context.vars.fileSize = fileSize;
  context.vars.fileContent = 'x'.repeat(fileSize); // Simple content for testing
  
  return done();
}

// Error injection for chaos testing
function injectErrors(context, events, done) {
  // Randomly inject errors to test system resilience
  const errorRate = parseFloat(process.env.ERROR_INJECTION_RATE || '0.05'); // 5% error rate
  
  if (Math.random() < errorRate) {
    // Inject different types of errors
    const errorTypes = ['timeout', 'invalid_data', 'network_error', 'auth_failure'];
    const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    
    context.vars.injectError = errorType;
    
    switch (errorType) {
      case 'timeout':
        // Simulate network timeout
        setTimeout(() => done(), 30000);
        return;
      case 'invalid_data':
        context.vars.email = 'invalid-email';
        break;
      case 'network_error':
        // Skip this request
        context.vars.skipRequest = true;
        break;
      case 'auth_failure':
        context.vars.authToken = 'invalid-token';
        break;
    }
  }
  
  return done();
}

// Performance monitoring
function recordMetrics(context, events, done) {
  const startTime = Date.now();
  
  // Record custom metrics
  events.emit('counter', 'custom.requests.started', 1);
  
  // Add timing information
  context.vars._startTime = startTime;
  context.vars._sessionId = crypto.randomBytes(16).toString('hex');
  
  return done();
}

// Session state management
function setupSession(context, events, done) {
  // Initialize session state
  context.vars.sessionData = {
    startTime: Date.now(),
    requestCount: 0,
    lastActivity: Date.now(),
    userAgent: `SENTRA-LoadTest/${Math.random().toString(36).substr(2, 5)}`
  };
  
  return done();
}

// Cleanup after test scenarios
function cleanup(context, events, done) {
  // Record session metrics
  if (context.vars.sessionData) {
    const sessionDuration = Date.now() - context.vars.sessionData.startTime;
    events.emit('histogram', 'custom.session.duration', sessionDuration);
    events.emit('counter', 'custom.requests.total', context.vars.sessionData.requestCount || 0);
  }
  
  // Clean up any resources
  delete context.vars.authToken;
  delete context.vars.sessionData;
  
  return done();
}

// Validate response data
function validateResponse(context, events, done) {
  // Add custom validation logic
  if (context.vars._response) {
    const response = context.vars._response;
    
    // Check response time
    if (response.responseTime > 5000) {
      events.emit('counter', 'custom.slow_responses', 1);
    }
    
    // Check for expected data structures
    if (response.body && typeof response.body === 'object') {
      if (response.body.data && Array.isArray(response.body.data)) {
        events.emit('counter', 'custom.valid_data_responses', 1);
      }
    }
  }
  
  return done();
}

// Load test data generation
function generateTestData(context, events, done) {
  // Generate comprehensive test data
  const testData = {
    user: {
      id: `user_${crypto.randomBytes(8).toString('hex')}`,
      email: `test-${Date.now()}@sentra.com`,
      name: `Test User ${Math.floor(Math.random() * 1000)}`,
      role: ['admin', 'developer', 'viewer'][Math.floor(Math.random() * 3)]
    },
    project: {
      id: `proj_${crypto.randomBytes(8).toString('hex')}`,
      name: `Load Test Project ${Math.floor(Math.random() * 10000)}`,
      description: 'Project created during load testing',
      technology: ['React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java'][Math.floor(Math.random() * 6)],
      complexity: ['simple', 'medium', 'complex'][Math.floor(Math.random() * 3)]
    },
    task: {
      id: `task_${crypto.randomBytes(8).toString('hex')}`,
      type: ['analysis', 'review', 'test', 'deploy'][Math.floor(Math.random() * 4)],
      priority: Math.floor(Math.random() * 5) + 1,
      estimatedDuration: Math.floor(Math.random() * 3600) + 300 // 5 minutes to 1 hour
    }
  };
  
  // Assign all test data to context variables
  Object.assign(context.vars, testData);
  
  return done();
}

// Export all functions
module.exports = {
  authenticate,
  generateProjectData,
  generateAgentTaskData,
  simulateUserDelay,
  generateFileData,
  injectErrors,
  recordMetrics,
  setupSession,
  cleanup,
  validateResponse,
  generateTestData
};