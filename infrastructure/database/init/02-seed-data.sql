-- SENTRA Development Seed Data
-- This script inserts initial data for development environment

-- Insert default admin user
INSERT INTO users (id, email, username, password_hash, full_name, role, is_active, email_verified) VALUES 
(
    'a0000000-0000-0000-0000-000000000001',
    'admin@sentra.dev',
    'admin',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    'SENTRA Administrator',
    'admin',
    true,
    true
);

-- Insert sample developer users
INSERT INTO users (id, email, username, password_hash, full_name, role, is_active, email_verified) VALUES 
(
    'b0000000-0000-0000-0000-000000000001',
    'developer1@sentra.dev',
    'dev1',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    'Senior Developer',
    'developer',
    true,
    true
),
(
    'b0000000-0000-0000-0000-000000000002',
    'developer2@sentra.dev',
    'dev2',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    'Junior Developer',
    'developer',
    true,
    true
);

-- Insert sample project
INSERT INTO projects (id, name, description, repository_url, owner_id, settings) VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'SENTRA Core',
    'The main SENTRA platform development project',
    'https://github.com/sentra/core',
    'a0000000-0000-0000-0000-000000000001',
    '{
        "enableAI": true,
        "qualityThreshold": 85,
        "autoReview": true,
        "testCoverage": 90
    }'
);

-- Add project members
INSERT INTO project_members (project_id, user_id, role, permissions) VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'lead_developer',
    '{
        "canManageMembers": true,
        "canModifySettings": true,
        "canDeployToProduction": true
    }'
),
(
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'developer',
    '{
        "canCreateTasks": true,
        "canReviewCode": true,
        "canDeployToStaging": true
    }'
);

-- Insert SENTRA agents
INSERT INTO agents (id, name, type, version, status, configuration, capabilities, resource_requirements) VALUES 
(
    'd0000000-0000-0000-0000-000000000001',
    'Code Analyzer Alpha',
    'code_analyzer',
    '1.0.0',
    'idle',
    '{
        "analysisDepth": "deep",
        "supportedLanguages": ["javascript", "typescript", "python", "go", "rust"],
        "enablePatternDetection": true,
        "enableComplexityAnalysis": true
    }',
    ARRAY['static_analysis', 'pattern_recognition', 'complexity_metrics', 'dependency_analysis'],
    '{
        "minCpuCores": 2,
        "minRamMb": 1024,
        "diskSpaceMb": 512,
        "networkRequired": true
    }'
),
(
    'd0000000-0000-0000-0000-000000000002',
    'Security Scanner Beta',
    'security_scanner',
    '1.0.0',
    'idle',
    '{
        "scanDepth": "comprehensive",
        "vulnerabilityDatabases": ["nvd", "cve", "owasp"],
        "enableRealTimeScanning": true
    }',
    ARRAY['vulnerability_scanning', 'dependency_checking', 'secrets_detection', 'compliance_validation'],
    '{
        "minCpuCores": 1,
        "minRamMb": 512,
        "diskSpaceMb": 256,
        "networkRequired": true
    }'
),
(
    'd0000000-0000-0000-0000-000000000003',
    'Performance Optimizer Gamma',
    'performance_optimizer',
    '1.0.0',
    'idle',
    '{
        "optimizationLevel": "aggressive",
        "enableMemoryProfiling": true,
        "enableCpuProfiling": true,
        "benchmarkingEnabled": true
    }',
    ARRAY['performance_analysis', 'bottleneck_detection', 'memory_optimization', 'cpu_optimization'],
    '{
        "minCpuCores": 4,
        "minRamMb": 2048,
        "diskSpaceMb": 1024,
        "networkRequired": false
    }'
),
(
    'd0000000-0000-0000-0000-000000000004',
    'Documentation Generator Delta',
    'documentation_generator',
    '1.0.0',
    'idle',
    '{
        "documentationFormats": ["markdown", "html", "pdf"],
        "includeExamples": true,
        "generateDiagrams": true,
        "autoUpdateEnabled": true
    }',
    ARRAY['code_documentation', 'api_documentation', 'diagram_generation', 'example_generation'],
    '{
        "minCpuCores": 1,
        "minRamMb": 512,
        "diskSpaceMb": 256,
        "networkRequired": false
    }'
),
(
    'd0000000-0000-0000-0000-000000000005',
    'Test Automator Epsilon',
    'test_automator',
    '1.0.0',
    'idle',
    '{
        "testTypes": ["unit", "integration", "e2e"],
        "frameworkSupport": ["jest", "cypress", "playwright", "pytest"],
        "autoGenerateTests": true,
        "coverageThreshold": 90
    }',
    ARRAY['test_generation', 'test_execution', 'coverage_analysis', 'test_maintenance'],
    '{
        "minCpuCores": 2,
        "minRamMb": 1024,
        "diskSpaceMb": 512,
        "networkRequired": true
    }'
),
(
    'd0000000-0000-0000-0000-000000000006',
    'Deployment Manager Zeta',
    'deployment_manager',
    '1.0.0',
    'idle',
    '{
        "supportedPlatforms": ["aws", "gcp", "azure", "kubernetes"],
        "enableRollback": true,
        "healthCheckEnabled": true,
        "autoScalingEnabled": true
    }',
    ARRAY['deployment_orchestration', 'infrastructure_management', 'monitoring_setup', 'rollback_management'],
    '{
        "minCpuCores": 2,
        "minRamMb": 1024,
        "diskSpaceMb": 256,
        "networkRequired": true
    }'
),
(
    'd0000000-0000-0000-0000-000000000007',
    'Code Reviewer Eta',
    'code_reviewer',
    '1.0.0',
    'idle',
    '{
        "reviewCriteria": ["functionality", "maintainability", "performance", "security"],
        "enableAutomatedComments": true,
        "suggestionLevel": "detailed",
        "integrationBranches": ["main", "develop"]
    }',
    ARRAY['code_review', 'style_checking', 'best_practices_validation', 'suggestion_generation'],
    '{
        "minCpuCores": 1,
        "minRamMb": 512,
        "diskSpaceMb": 256,
        "networkRequired": true
    }'
),
(
    'd0000000-0000-0000-0000-000000000008',
    'Quality Enforcer Theta',
    'quality_enforcer',
    '1.0.0',
    'idle',
    '{
        "qualityGates": ["code_coverage", "complexity", "duplication", "maintainability"],
        "enforcementLevel": "strict",
        "autoBlockEnabled": true,
        "reportingEnabled": true
    }',
    ARRAY['quality_gating', 'metrics_collection', 'policy_enforcement', 'compliance_monitoring'],
    '{
        "minCpuCores": 1,
        "minRamMb": 256,
        "diskSpaceMb": 128,
        "networkRequired": false
    }'
);

-- Insert sample tasks
INSERT INTO tasks (id, title, description, status, priority, project_id, assigned_to, created_by, estimated_hours, tags, metadata) VALUES 
(
    'e0000000-0000-0000-0000-000000000001',
    'Implement API Gateway Service',
    'Create the main API Gateway service with routing, authentication, and rate limiting',
    'in_progress',
    'high',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    16,
    ARRAY['backend', 'api', 'gateway', 'authentication'],
    '{
        "complexity": "high",
        "category": "development",
        "milestone": "core-services"
    }'
),
(
    'e0000000-0000-0000-0000-000000000002',
    'Set up Agent Orchestrator',
    'Implement the agent orchestration service for managing AI agents',
    'pending',
    'high',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    20,
    ARRAY['backend', 'agents', 'orchestration', 'ai'],
    '{
        "complexity": "very_high",
        "category": "development",
        "milestone": "core-services"
    }'
),
(
    'e0000000-0000-0000-0000-000000000003',
    'Design Context Preservation Engine',
    'Create the context preservation system with zero-loss guarantee',
    'pending',
    'critical',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    24,
    ARRAY['backend', 'context', 'preservation', 'ai'],
    '{
        "complexity": "very_high",
        "category": "development",
        "milestone": "core-services"
    }'
);

-- Insert sample contexts
INSERT INTO contexts (id, type, name, description, project_id, user_id, data, metadata, tags) VALUES 
(
    'f0000000-0000-0000-0000-000000000001',
    'project',
    'SENTRA Core Context',
    'Main project context for SENTRA development',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '{
        "architecture": "microservices",
        "primaryLanguage": "typescript",
        "framework": "express",
        "database": "postgresql",
        "caching": "redis",
        "containerization": "docker"
    }',
    '{
        "isMainContext": true,
        "priority": "high"
    }',
    ARRAY['project', 'core', 'microservices', 'typescript']
);

-- Insert sample conversation
INSERT INTO conversations (id, title, project_id, user_id, context_id, metadata) VALUES 
(
    '90000000-0000-0000-0000-000000000001',
    'Initial System Architecture Discussion',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    '{
        "importance": "high",
        "category": "architecture"
    }'
);

-- Insert sample messages
INSERT INTO messages (id, conversation_id, user_id, content, content_type, metadata) VALUES 
(
    '80000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'We need to design a robust microservices architecture for SENTRA that can handle multi-agent orchestration efficiently.',
    'text',
    '{
        "timestamp": "2024-01-01T10:00:00Z",
        "importance": "high"
    }'
);

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, data) VALUES 
(
    'a0000000-0000-0000-0000-000000000001',
    'Welcome to SENTRA',
    'Your SENTRA development environment has been successfully set up. You can now begin exploring the platform.',
    'success',
    '{
        "action": "setup_complete",
        "nextSteps": ["explore_dashboard", "create_project", "configure_agents"]
    }'
),
(
    'b0000000-0000-0000-0000-000000000001',
    'Task Assignment',
    'You have been assigned to work on the API Gateway Service implementation.',
    'info',
    '{
        "taskId": "e0000000-0000-0000-0000-000000000001",
        "priority": "high",
        "dueDate": "2024-02-01"
    }'
);

-- Insert sample quality metrics
INSERT INTO quality_metrics (project_id, metric_type, value, threshold, status, metadata) VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'code_coverage',
    85.5,
    90.0,
    'warning',
    '{
        "measurement": "percentage",
        "source": "jest",
        "lastUpdated": "2024-01-01T12:00:00Z"
    }'
),
(
    'c0000000-0000-0000-0000-000000000001',
    'complexity_score',
    7.2,
    10.0,
    'good',
    '{
        "measurement": "cyclomatic_complexity",
        "source": "eslint",
        "lastUpdated": "2024-01-01T12:00:00Z"
    }'
);

-- Insert sample timeline events
INSERT INTO timeline_events (project_id, event_type, title, description, actor_id, data) VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'project_created',
    'Project Created',
    'SENTRA Core project has been created and initialized',
    'a0000000-0000-0000-0000-000000000001',
    '{
        "initialMembers": 3,
        "repositoryUrl": "https://github.com/sentra/core"
    }'
),
(
    'c0000000-0000-0000-0000-000000000001',
    'agent_registered',
    'Agents Registered',
    'All 8 SENTRA agents have been registered and are ready for use',
    'a0000000-0000-0000-0000-000000000001',
    '{
        "agentCount": 8,
        "agentTypes": ["code_analyzer", "security_scanner", "performance_optimizer", "documentation_generator", "test_automator", "deployment_manager", "code_reviewer", "quality_enforcer"]
    }'
);

-- Update agent heartbeats to current time
UPDATE agents SET last_heartbeat = CURRENT_TIMESTAMP WHERE status = 'idle';