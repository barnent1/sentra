import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { glob } from 'glob';
import Anthropic from '@anthropic-ai/sdk';
import * as eslint from 'eslint';
import * as ts from 'typescript';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { MessageQueue } from '../utils/messageQueue';
import { ContextClient } from '../utils/contextClient';

export interface QualityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'security' | 'performance' | 'maintainability' | 'reliability' | 'style';
  title: string;
  description: string;
  file: string;
  line?: number;
  column?: number;
  rule?: string;
  suggestion?: string;
  codeExample?: string;
  fixExample?: string;
  impact: string;
  effortToFix: 'trivial' | 'minor' | 'major' | 'significant';
}

export interface CodeReviewResult {
  taskId: string;
  reviewId: string;
  approved: boolean;
  qualityScore: number;
  overallAssessment: string;
  issues: QualityIssue[];
  positiveFindings: string[];
  recommendations: string[];
  securityAssessment: {
    score: number;
    vulnerabilities: QualityIssue[];
    recommendations: string[];
  };
  performanceAssessment: {
    score: number;
    issues: QualityIssue[];
    recommendations: string[];
  };
  maintainabilityScore: number;
  testCoverage?: {
    percentage: number;
    missingTests: string[];
  };
  codeComplexity: {
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    linesOfCode: number;
  };
  adherenceToStandards: {
    typescript: number;
    nextjs: number;
    drizzle: number;
    accessibility: number;
  };
  timestamp: string;
}

export interface Task {
  id: string;
  type: string;
  data: any;
  timeout?: number;
  contextId?: string;
  startedAt: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'timeout';
  progress: number;
  result?: any;
  error?: string;
}

export class SarahAgent extends EventEmitter {
  private anthropic: Anthropic;
  private activeTasks = new Map<string, Task>();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private eslintInstance: eslint.ESLint;
  private qualityStandards = {
    minimumScore: 0.8,
    criticalIssuesThreshold: 0,
    highIssuesThreshold: 2,
    testCoverageMinimum: 80,
    cyclomaticComplexityMax: 10,
    cognitiveComplexityMax: 15,
    linesOfCodeMax: 300
  };

  constructor() {
    super();

    // Initialize Anthropic AI client with specialized Sarah persona
    if (!config.anthropic.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required for Sarah agent');
    }

    this.anthropic = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });

    // Initialize ESLint with strict configuration
    this.eslintInstance = new eslint.ESLint({
      baseConfig: this.createStrictESLintConfig(),
      useEslintrc: false,
      fix: false
    });
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Sarah QA Agent with adversarial review capabilities...');

    try {
      // Setup message handlers for QA-specific tasks
      await this.setupMessageHandlers();

      // Start heartbeat with QA agent identification
      this.startHeartbeat();

      logger.info('Sarah QA Agent initialized successfully - Ready for adversarial code review');
    } catch (error) {
      logger.error('Failed to initialize Sarah QA Agent:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Sarah QA Agent...');

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Complete any active reviews with shutdown notice
    for (const task of this.activeTasks.values()) {
      if (task.status === 'in_progress') {
        await this.failTask(task.id, new Error('Sarah agent shutting down - review incomplete'));
      }
    }

    logger.info('Sarah QA Agent shutdown complete');
  }

  private async setupMessageHandlers(): Promise<void> {
    // Subscribe to QA-specific task messages
    await MessageQueue.subscribeToAgentTasks(async (message, routingKey) => {
      try {
        const { messageType, data } = message;
        
        switch (messageType) {
          case 'execute_task':
            await this.handleTaskExecution(data);
            break;
          case 'cancel_task':
            await this.handleTaskCancellation(data);
            break;
          case 'quality_review':
            await this.handleQualityReviewRequest(data);
            break;
          case 'adversarial_review':
            await this.handleAdversarialReviewRequest(data);
            break;
          case 'security_scan':
            await this.handleSecurityScanRequest(data);
            break;
          case 'get_status':
            await this.handleStatusRequest(data);
            break;
          default:
            logger.warn('Unknown message type for Sarah QA Agent:', { messageType, routingKey });
        }
      } catch (error) {
        logger.error('Message handler error in Sarah QA Agent:', { routingKey, error });
      }
    });

    logger.info('Sarah QA Agent message handlers setup complete');
  }

  private async handleTaskExecution(taskData: any): Promise<void> {
    const { taskId, type, data, timeout } = taskData;
    
    try {
      logger.info('Sarah starting QA task execution', { taskId, type });

      const task: Task = {
        id: taskId,
        type,
        data,
        timeout: timeout || config.tasks.taskTimeout,
        startedAt: new Date(),
        status: 'in_progress',
        progress: 0,
      };

      this.activeTasks.set(taskId, task);

      // Create adversarial review context
      const contextId = await ContextClient.createTaskContext(
        taskId, 
        `sarah_qa_${type}`, 
        { ...data, reviewerPersona: 'adversarial' }
      );
      task.contextId = contextId;

      // Execute QA task based on type
      const result = await this.executeQATask(task);

      // Complete task with quality assessment
      await this.completeTask(taskId, result);

    } catch (error) {
      logger.error('Sarah QA task execution failed:', { taskId, error });
      await this.failTask(taskId, error as Error);
    }
  }

  private async executeQATask(task: Task): Promise<any> {
    logger.info('Sarah executing QA task', { taskId: task.id, type: task.type });

    try {
      switch (task.type) {
        case 'code_review':
          return await this.performAdversarialCodeReview(task);
        case 'quality_audit':
          return await this.performQualityAudit(task);
        case 'security_review':
          return await this.performSecurityReview(task);
        case 'performance_review':
          return await this.performPerformanceReview(task);
        case 'accessibility_review':
          return await this.performAccessibilityReview(task);
        case 'test_coverage_analysis':
          return await this.performTestCoverageAnalysis(task);
        case 'architecture_review':
          return await this.performArchitectureReview(task);
        default:
          throw new Error(`Sarah doesn't recognize QA task type: ${task.type}`);
      }
    } catch (error) {
      logger.error('Sarah QA task execution error:', { taskId: task.id, type: task.type, error });
      throw error;
    }
  }

  private async performAdversarialCodeReview(task: Task): Promise<CodeReviewResult> {
    const { filePaths, pullRequestId, baseCommit, headCommit } = task.data;
    
    this.updateTaskProgress(task.id, 5, 'Sarah beginning adversarial code review...');

    const reviewId = uuidv4();
    const issues: QualityIssue[] = [];
    const positiveFindings: string[] = [];
    let qualityScore = 1.0;

    // Phase 1: Static Code Analysis with ESLint
    this.updateTaskProgress(task.id, 15, 'Running static analysis with zero-tolerance rules...');
    
    for (const filePath of filePaths) {
      try {
        const fullPath = path.resolve(filePath);
        const results = await this.eslintInstance.lintFiles([fullPath]);
        
        for (const result of results) {
          for (const message of result.messages) {
            const severity = this.mapESLintSeverityToQualityIssue(message.severity);
            if (severity === 'critical' || severity === 'high') {
              qualityScore -= 0.1;
            }
            
            issues.push({
              id: uuidv4(),
              severity,
              category: this.categorizeESLintRule(message.ruleId || ''),
              title: `${message.ruleId}: ${message.message}`,
              description: message.message,
              file: result.filePath,
              line: message.line,
              column: message.column,
              rule: message.ruleId || 'unknown',
              impact: this.getImpactDescription(severity),
              effortToFix: this.getEffortToFix(message.ruleId || ''),
              suggestion: this.getFixSuggestion(message.ruleId || '', message.message)
            });
          }
        }
      } catch (error) {
        logger.error('ESLint analysis failed for file:', { filePath, error });
      }
    }

    // Phase 2: TypeScript Compilation Analysis
    this.updateTaskProgress(task.id, 25, 'Analyzing TypeScript compliance...');
    const tsIssues = await this.analyzeTypeScriptCompliance(filePaths);
    issues.push(...tsIssues);

    // Phase 3: Security Vulnerability Detection
    this.updateTaskProgress(task.id, 40, 'Scanning for security vulnerabilities...');
    const securityIssues = await this.performSecurityScan(filePaths);
    issues.push(...securityIssues.vulnerabilities);

    // Phase 4: Performance Analysis
    this.updateTaskProgress(task.id, 55, 'Analyzing performance implications...');
    const performanceIssues = await this.analyzePerformancePatterns(filePaths);
    issues.push(...performanceIssues.issues);

    // Phase 5: Adversarial AI Review
    this.updateTaskProgress(task.id, 70, 'Conducting adversarial AI review...');
    const aiReviewResult = await this.performAdversarialAIReview(filePaths);
    issues.push(...aiReviewResult.issues);
    positiveFindings.push(...aiReviewResult.positiveFindings);

    // Phase 6: Architecture and Design Review
    this.updateTaskProgress(task.id, 85, 'Reviewing architecture and design decisions...');
    const architectureIssues = await this.reviewArchitecture(filePaths);
    issues.push(...architectureIssues);

    // Calculate final quality score and approval decision
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    
    // Sarah's zero-tolerance approach
    const approved = criticalIssues === 0 && 
                    highIssues <= this.qualityStandards.highIssuesThreshold &&
                    qualityScore >= this.qualityStandards.minimumScore;

    this.updateTaskProgress(task.id, 95, 'Generating comprehensive review report...');

    const result: CodeReviewResult = {
      taskId: task.id,
      reviewId,
      approved,
      qualityScore: Math.max(0, qualityScore),
      overallAssessment: this.generateOverallAssessment(approved, issues, qualityScore),
      issues: issues.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity)),
      positiveFindings,
      recommendations: this.generateRecommendations(issues),
      securityAssessment: {
        score: securityIssues.score,
        vulnerabilities: securityIssues.vulnerabilities,
        recommendations: securityIssues.recommendations
      },
      performanceAssessment: {
        score: performanceIssues.score,
        issues: performanceIssues.issues,
        recommendations: performanceIssues.recommendations
      },
      maintainabilityScore: this.calculateMaintainabilityScore(issues),
      codeComplexity: await this.calculateCodeComplexity(filePaths),
      adherenceToStandards: await this.assessStandardsAdherence(filePaths),
      timestamp: new Date().toISOString()
    };

    // Add review results to context
    if (task.contextId) {
      await ContextClient.addConversationEntry(
        task.contextId,
        'assistant',
        `Sarah's Adversarial Code Review Complete: ${approved ? 'APPROVED' : 'REJECTED'}\n\nQuality Score: ${result.qualityScore.toFixed(2)}\nCritical Issues: ${criticalIssues}\nHigh Issues: ${highIssues}\n\nOverall Assessment: ${result.overallAssessment}`
      );
    }

    this.updateTaskProgress(task.id, 100, `Review complete - ${approved ? 'APPROVED' : 'REJECTED'}`);

    return result;
  }

  private async performAdversarialAIReview(filePaths: string[]): Promise<{
    issues: QualityIssue[];
    positiveFindings: string[];
  }> {
    const issues: QualityIssue[] = [];
    const positiveFindings: string[] = [];

    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Sarah's adversarial AI prompt - designed to find problems
        const adversarialPrompt = this.buildAdversarialReviewPrompt(content, filePath);
        
        const response = await this.anthropic.messages.create({
          model: config.anthropic.model,
          max_tokens: 4000,
          messages: [{ role: 'user', content: adversarialPrompt }],
        });

        const reviewText = response.content[0]?.type === 'text' ? response.content[0].text : '';
        
        // Parse AI response for issues and findings
        const parsedResult = this.parseAIReviewResponse(reviewText, filePath);
        issues.push(...parsedResult.issues);
        positiveFindings.push(...parsedResult.positiveFindings);
        
      } catch (error) {
        logger.error('Adversarial AI review failed for file:', { filePath, error });
        issues.push({
          id: uuidv4(),
          severity: 'high',
          category: 'reliability',
          title: 'AI Review Failed',
          description: `Could not complete adversarial AI review for ${filePath}`,
          file: filePath,
          impact: 'Review process incomplete - manual review required',
          effortToFix: 'minor'
        });
      }
    }

    return { issues, positiveFindings };
  }

  private buildAdversarialReviewPrompt(content: string, filePath: string): string {
    return `You are Sarah, a senior QA engineer with 15+ years of experience known for finding critical bugs that others miss. You have a zero-tolerance approach to code quality and are specifically tasked with adversarial code review.

Your mission: Find every possible issue, vulnerability, performance problem, maintainability concern, and deviation from best practices in this code. Be thorough, critical, and uncompromising.

File: ${filePath}

Code:
\`\`\`typescript
${content}
\`\`\`

Perform an exhaustive adversarial review focusing on:

1. **CRITICAL SECURITY ISSUES** (Zero tolerance):
   - Injection vulnerabilities (SQL, NoSQL, LDAP, etc.)
   - XSS vulnerabilities
   - Authentication/authorization bypasses
   - Insecure data handling
   - Exposed sensitive information
   - CSRF vulnerabilities
   - Insecure direct object references

2. **TYPE SAFETY VIOLATIONS** (Zero tolerance):
   - Any use of 'any' type
   - Disabled TypeScript checks
   - Missing type annotations
   - Unsafe type assertions
   - Non-null assertion abuse

3. **PERFORMANCE KILLERS**:
   - Memory leaks
   - Inefficient algorithms
   - Unnecessary re-renders
   - Blocking operations
   - Large bundle impacts
   - Database N+1 queries

4. **MAINTAINABILITY DISASTERS**:
   - Code complexity violations
   - Violation of SOLID principles
   - Tight coupling
   - Missing error handling
   - Inadequate testing coverage
   - Inconsistent patterns

5. **FRAMEWORK VIOLATIONS**:
   - Next.js anti-patterns
   - React hook violations
   - Server/client boundary issues
   - Hydration problems

6. **ARCHITECTURAL CONCERNS**:
   - Violation of project patterns
   - Improper separation of concerns
   - API design issues
   - State management problems

For each issue found, provide:
- Severity: CRITICAL/HIGH/MEDIUM/LOW
- Category: security/performance/maintainability/reliability
- Exact line number if possible
- Why it's problematic
- Potential impact
- How to fix it

Also note any genuinely good practices you observe, but be sparing with praise - focus on finding problems.

Format your response as structured JSON with issues and positiveFindings arrays.`;
  }

  private parseAIReviewResponse(reviewText: string, filePath: string): {
    issues: QualityIssue[];
    positiveFindings: string[];
  } {
    const issues: QualityIssue[] = [];
    const positiveFindings: string[] = [];

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(reviewText);
      if (parsed.issues) {
        for (const issue of parsed.issues) {
          issues.push({
            id: uuidv4(),
            severity: this.normalizeSeverity(issue.severity),
            category: this.normalizeCategory(issue.category),
            title: issue.title || 'AI Detected Issue',
            description: issue.description || issue.problem || '',
            file: filePath,
            line: issue.line,
            suggestion: issue.fix || issue.solution,
            impact: issue.impact || 'Impact assessment needed',
            effortToFix: this.estimateEffort(issue.description || '')
          });
        }
      }
      if (parsed.positiveFindings) {
        positiveFindings.push(...parsed.positiveFindings);
      }
    } catch (error) {
      // Fallback to text parsing if JSON parsing fails
      const textIssues = this.parseTextReview(reviewText, filePath);
      issues.push(...textIssues);
    }

    return { issues, positiveFindings };
  }

  private parseTextReview(reviewText: string, filePath: string): QualityIssue[] {
    const issues: QualityIssue[] = [];
    
    // Simple text parsing for non-JSON responses
    const lines = reviewText.split('\n');
    let currentIssue: Partial<QualityIssue> = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('CRITICAL') || trimmedLine.includes('HIGH') || 
          trimmedLine.includes('MEDIUM') || trimmedLine.includes('LOW')) {
        
        if (currentIssue.description) {
          issues.push({
            id: uuidv4(),
            severity: this.extractSeverity(trimmedLine),
            category: this.extractCategory(trimmedLine),
            title: currentIssue.title || 'AI Detected Issue',
            description: currentIssue.description || trimmedLine,
            file: filePath,
            impact: 'Review required',
            effortToFix: 'minor'
          } as QualityIssue);
        }
        
        currentIssue = {
          title: trimmedLine,
          description: trimmedLine
        };
      } else if (trimmedLine.length > 0) {
        currentIssue.description = (currentIssue.description || '') + ' ' + trimmedLine;
      }
    }
    
    return issues;
  }

  private async analyzeTypeScriptCompliance(filePaths: string[]): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    
    for (const filePath of filePaths) {
      if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) continue;
      
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Check for 'any' usage (zero tolerance)
        const anyMatches = content.match(/:\s*any\b/g);
        if (anyMatches) {
          issues.push({
            id: uuidv4(),
            severity: 'critical',
            category: 'reliability',
            title: 'TypeScript Any Type Usage',
            description: `Found ${anyMatches.length} uses of 'any' type. This completely defeats TypeScript's type safety.`,
            file: filePath,
            suggestion: 'Replace all any types with proper TypeScript types',
            impact: 'Eliminates type safety and compile-time error detection',
            effortToFix: 'major'
          });
        }

        // Check for @ts-ignore or @ts-nocheck (zero tolerance)
        const tsIgnoreMatches = content.match(/@ts-(ignore|nocheck)/g);
        if (tsIgnoreMatches) {
          issues.push({
            id: uuidv4(),
            severity: 'critical',
            category: 'reliability',
            title: 'TypeScript Check Disabled',
            description: `Found ${tsIgnoreMatches.length} TypeScript compiler suppressions. This is prohibited.`,
            file: filePath,
            suggestion: 'Remove @ts-ignore/@ts-nocheck and fix the underlying TypeScript issues',
            impact: 'Disables TypeScript error checking and type safety',
            effortToFix: 'significant'
          });
        }

        // Check for non-null assertions without proper guards
        const nonNullMatches = content.match(/!\s*\./g);
        if (nonNullMatches) {
          issues.push({
            id: uuidv4(),
            severity: 'high',
            category: 'reliability',
            title: 'Unsafe Non-Null Assertion',
            description: `Found ${nonNullMatches.length} non-null assertions. These can cause runtime errors.`,
            file: filePath,
            suggestion: 'Add proper null checks or optional chaining instead of non-null assertions',
            impact: 'Can cause runtime null/undefined errors',
            effortToFix: 'minor'
          });
        }

      } catch (error) {
        logger.error('TypeScript compliance analysis failed:', { filePath, error });
      }
    }
    
    return issues;
  }

  private async performSecurityScan(filePaths: string[]): Promise<{
    score: number;
    vulnerabilities: QualityIssue[];
    recommendations: string[];
  }> {
    const vulnerabilities: QualityIssue[] = [];
    const recommendations: string[] = [];
    let securityScore = 1.0;

    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // SQL Injection patterns
        const sqlPatterns = [
          /query\s*\(\s*[`'"]\s*\$\{.*\}\s*[`'"]\s*\)/gi,
          /execute\s*\(\s*[`'"]\s*\$\{.*\}\s*[`'"]\s*\)/gi,
          /\$\{.*\}\s*INTO\s/gi
        ];
        
        for (const pattern of sqlPatterns) {
          if (pattern.test(content)) {
            vulnerabilities.push({
              id: uuidv4(),
              severity: 'critical',
              category: 'security',
              title: 'Potential SQL Injection',
              description: 'Dynamic SQL query construction detected. This can lead to SQL injection vulnerabilities.',
              file: filePath,
              suggestion: 'Use parameterized queries or ORM methods instead of string concatenation',
              impact: 'Complete database compromise possible',
              effortToFix: 'major'
            });
            securityScore -= 0.3;
          }
        }

        // XSS patterns
        const xssPatterns = [
          /dangerouslySetInnerHTML/gi,
          /innerHTML\s*=/gi,
          /document\.write/gi
        ];
        
        for (const pattern of xssPatterns) {
          if (pattern.test(content)) {
            vulnerabilities.push({
              id: uuidv4(),
              severity: 'high',
              category: 'security',
              title: 'Potential XSS Vulnerability',
              description: 'Direct HTML insertion detected without sanitization',
              file: filePath,
              suggestion: 'Use React JSX or properly sanitize HTML content',
              impact: 'Cross-site scripting attacks possible',
              effortToFix: 'minor'
            });
            securityScore -= 0.2;
          }
        }

        // Hardcoded secrets patterns
        const secretPatterns = [
          /password\s*[:=]\s*['"]/gi,
          /secret\s*[:=]\s*['"]/gi,
          /key\s*[:=]\s*['"][^'"]{10,}/gi,
          /token\s*[:=]\s*['"][^'"]{10,}/gi
        ];
        
        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            vulnerabilities.push({
              id: uuidv4(),
              severity: 'critical',
              category: 'security',
              title: 'Hardcoded Secret Detected',
              description: 'Secrets or sensitive data appear to be hardcoded in source code',
              file: filePath,
              suggestion: 'Move secrets to environment variables or secure configuration',
              impact: 'Credential exposure and unauthorized access',
              effortToFix: 'minor'
            });
            securityScore -= 0.4;
          }
        }

      } catch (error) {
        logger.error('Security scan failed for file:', { filePath, error });
      }
    }

    if (vulnerabilities.length === 0) {
      recommendations.push('No obvious security vulnerabilities detected in static analysis');
    } else {
      recommendations.push('Address all critical and high severity security issues before deployment');
      recommendations.push('Consider additional security testing including SAST/DAST tools');
      recommendations.push('Implement security code review process');
    }

    return {
      score: Math.max(0, securityScore),
      vulnerabilities,
      recommendations
    };
  }

  private async analyzePerformancePatterns(filePaths: string[]): Promise<{
    score: number;
    issues: QualityIssue[];
    recommendations: string[];
  }> {
    const issues: QualityIssue[] = [];
    const recommendations: string[] = [];
    let performanceScore = 1.0;

    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // React performance anti-patterns
        if (filePath.includes('.tsx') || filePath.includes('.jsx')) {
          // Inline object/function creation in JSX
          const inlineObjectPattern = /\w+\s*=\s*\{\{/g;
          const inlineFunctionPattern = /\w+\s*=\s*\(\)\s*=>/g;
          
          if (inlineObjectPattern.test(content)) {
            issues.push({
              id: uuidv4(),
              severity: 'medium',
              category: 'performance',
              title: 'Inline Object Creation in JSX',
              description: 'Inline object creation in JSX props causes unnecessary re-renders',
              file: filePath,
              suggestion: 'Move object creation outside render or use useMemo',
              impact: 'Unnecessary component re-renders',
              effortToFix: 'minor'
            });
            performanceScore -= 0.1;
          }
          
          if (inlineFunctionPattern.test(content)) {
            issues.push({
              id: uuidv4(),
              severity: 'medium',
              category: 'performance',
              title: 'Inline Function Creation in JSX',
              description: 'Inline function creation in JSX props causes unnecessary re-renders',
              file: filePath,
              suggestion: 'Move function creation outside render or use useCallback',
              impact: 'Unnecessary component re-renders',
              effortToFix: 'minor'
            });
            performanceScore -= 0.1;
          }
        }

        // Inefficient loops
        const nestedLoopPattern = /for\s*\([^}]+\{[^}]*for\s*\(/g;
        if (nestedLoopPattern.test(content)) {
          issues.push({
            id: uuidv4(),
            severity: 'high',
            category: 'performance',
            title: 'Nested Loop Detected',
            description: 'Nested loops can cause performance issues with large datasets',
            file: filePath,
            suggestion: 'Consider algorithm optimization or data structure changes',
            impact: 'O(n²) time complexity - performance degrades with data size',
            effortToFix: 'major'
          });
          performanceScore -= 0.2;
        }

        // Synchronous file operations
        const syncFilePattern = /fs\.readFileSync|fs\.writeFileSync|fs\.existsSync/g;
        if (syncFilePattern.test(content)) {
          issues.push({
            id: uuidv4(),
            severity: 'high',
            category: 'performance',
            title: 'Synchronous File Operation',
            description: 'Synchronous file operations block the event loop',
            file: filePath,
            suggestion: 'Use asynchronous file operations (fs-extra or fs/promises)',
            impact: 'Blocks Node.js event loop, poor server performance',
            effortToFix: 'minor'
          });
          performanceScore -= 0.2;
        }

      } catch (error) {
        logger.error('Performance analysis failed for file:', { filePath, error });
      }
    }

    if (issues.length === 0) {
      recommendations.push('No obvious performance issues detected');
    } else {
      recommendations.push('Address high-severity performance issues');
      recommendations.push('Consider performance testing with realistic data loads');
      recommendations.push('Monitor performance metrics in production');
    }

    return {
      score: Math.max(0, performanceScore),
      issues,
      recommendations
    };
  }

  private async reviewArchitecture(filePaths: string[]): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Check for architectural violations
    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Prisma usage (forbidden in favor of Drizzle)
        if (content.includes('PrismaClient') || content.includes('@prisma/client')) {
          issues.push({
            id: uuidv4(),
            severity: 'critical',
            category: 'maintainability',
            title: 'Forbidden Prisma Usage',
            description: 'Prisma ORM is forbidden in this project. Drizzle ORM must be used.',
            file: filePath,
            suggestion: 'Replace Prisma with Drizzle ORM implementation',
            impact: 'Violates project architecture standards',
            effortToFix: 'significant'
          });
        }

        // Check for proper JSX text wrapping (project requirement)
        const jsxTextPattern = />\s*[^<{]*['"`][^<{]*</g;
        if (jsxTextPattern.test(content)) {
          issues.push({
            id: uuidv4(),
            severity: 'medium',
            category: 'maintainability',
            title: 'JSX Text Not Properly Wrapped',
            description: 'Text with special characters in JSX should be wrapped in quotes and curly braces',
            file: filePath,
            suggestion: 'Wrap JSX text containing special characters with {"text"}',
            impact: 'Violates project coding standards',
            effortToFix: 'trivial'
          });
        }

      } catch (error) {
        logger.error('Architecture review failed for file:', { filePath, error });
      }
    }

    return issues;
  }

  private async calculateCodeComplexity(filePaths: string[]): Promise<{
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    linesOfCode: number;
  }> {
    let totalCyclomaticComplexity = 0;
    let totalCognitiveComplexity = 0;
    let totalLinesOfCode = 0;

    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        totalLinesOfCode += lines.length;

        // Simple complexity calculation
        const ifMatches = (content.match(/\bif\b/g) || []).length;
        const forMatches = (content.match(/\bfor\b/g) || []).length;
        const whileMatches = (content.match(/\bwhile\b/g) || []).length;
        const switchMatches = (content.match(/\bswitch\b/g) || []).length;
        const catchMatches = (content.match(/\bcatch\b/g) || []).length;

        const fileCyclomaticComplexity = 1 + ifMatches + forMatches + whileMatches + switchMatches + catchMatches;
        totalCyclomaticComplexity += fileCyclomaticComplexity;

        // Simplified cognitive complexity (would need proper AST analysis for accuracy)
        const nestedLevels = (content.match(/\{\s*\{/g) || []).length;
        const fileCognitiveComplexity = fileCyclomaticComplexity + nestedLevels;
        totalCognitiveComplexity += fileCognitiveComplexity;

      } catch (error) {
        logger.error('Code complexity calculation failed:', { filePath, error });
      }
    }

    return {
      cyclomaticComplexity: Math.round(totalCyclomaticComplexity / filePaths.length),
      cognitiveComplexity: Math.round(totalCognitiveComplexity / filePaths.length),
      linesOfCode: totalLinesOfCode
    };
  }

  private async assessStandardsAdherence(filePaths: string[]): Promise<{
    typescript: number;
    nextjs: number;
    drizzle: number;
    accessibility: number;
  }> {
    let tsScore = 1.0;
    let nextjsScore = 1.0;
    let drizzleScore = 1.0;
    let a11yScore = 1.0;

    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');

        // TypeScript adherence
        if (content.includes(': any')) tsScore -= 0.2;
        if (content.includes('@ts-ignore')) tsScore -= 0.3;

        // Next.js adherence
        if (filePath.includes('pages/') && !content.includes('export default')) nextjsScore -= 0.2;
        if (content.includes('document.') && !filePath.includes('_document.')) nextjsScore -= 0.1;

        // Drizzle usage (positive scoring)
        if (content.includes('drizzle-orm')) drizzleScore = Math.min(1.0, drizzleScore + 0.1);
        if (content.includes('PrismaClient')) drizzleScore = 0;

        // Accessibility
        if (content.includes('<img') && !content.includes('alt=')) a11yScore -= 0.1;
        if (content.includes('<button') && !content.includes('aria-')) a11yScore -= 0.05;

      } catch (error) {
        logger.error('Standards adherence assessment failed:', { filePath, error });
      }
    }

    return {
      typescript: Math.max(0, tsScore),
      nextjs: Math.max(0, nextjsScore),
      drizzle: Math.max(0, drizzleScore),
      accessibility: Math.max(0, a11yScore)
    };
  }

  // Utility methods
  private createStrictESLintConfig(): any {
    return {
      extends: [
        '@typescript-eslint/recommended',
        '@typescript-eslint/recommended-requiring-type-checking'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/prefer-nullish-coalescing': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',
        '@typescript-eslint/no-unused-vars': 'error',
        'complexity': ['error', { max: 10 }],
        'max-depth': ['error', { max: 4 }],
        'max-lines-per-function': ['error', { max: 50 }],
        'no-console': 'warn',
        'no-debugger': 'error',
        'prefer-const': 'error',
        'no-var': 'error'
      }
    };
  }

  private mapESLintSeverityToQualityIssue(severity: number): 'critical' | 'high' | 'medium' | 'low' {
    switch (severity) {
      case 2: return 'high';
      case 1: return 'medium';
      default: return 'low';
    }
  }

  private categorizeESLintRule(ruleId: string): QualityIssue['category'] {
    if (ruleId.includes('security')) return 'security';
    if (ruleId.includes('performance') || ruleId.includes('complexity')) return 'performance';
    if (ruleId.includes('style') || ruleId.includes('format')) return 'style';
    return 'maintainability';
  }

  private getImpactDescription(severity: string): string {
    switch (severity) {
      case 'critical': return 'Critical impact - immediate fix required';
      case 'high': return 'High impact - fix before merge';
      case 'medium': return 'Medium impact - should be addressed';
      case 'low': return 'Low impact - consider for future improvement';
      default: return 'Impact assessment needed';
    }
  }

  private getEffortToFix(ruleId: string): QualityIssue['effortToFix'] {
    const trivialRules = ['semi', 'quotes', 'indent'];
    const minorRules = ['no-unused-vars', 'prefer-const'];
    const majorRules = ['complexity', 'no-explicit-any'];
    
    if (trivialRules.some(rule => ruleId.includes(rule))) return 'trivial';
    if (minorRules.some(rule => ruleId.includes(rule))) return 'minor';
    if (majorRules.some(rule => ruleId.includes(rule))) return 'major';
    return 'minor';
  }

  private getFixSuggestion(ruleId: string, message: string): string {
    const suggestions: Record<string, string> = {
      'no-explicit-any': 'Replace any with a specific type',
      'no-unused-vars': 'Remove unused variable or prefix with underscore',
      'prefer-const': 'Change let to const for variables that are never reassigned',
      'complexity': 'Break down this function into smaller, more focused functions',
      'max-lines-per-function': 'Split this function into smaller functions',
    };
    
    return suggestions[ruleId] || 'Review and fix according to the rule documentation';
  }

  private generateOverallAssessment(approved: boolean, issues: QualityIssue[], qualityScore: number): string {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    
    if (!approved) {
      return `REJECTED: Code review failed due to ${criticalCount} critical and ${highCount} high severity issues. Quality score: ${qualityScore.toFixed(2)}. All critical issues must be resolved before approval.`;
    } else {
      return `APPROVED: Code meets quality standards with score ${qualityScore.toFixed(2)}. ${issues.length} total issues found, but within acceptable thresholds.`;
    }
  }

  private generateRecommendations(issues: QualityIssue[]): string[] {
    const recommendations: string[] = [];
    
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const securityCount = issues.filter(i => i.category === 'security').length;
    const performanceCount = issues.filter(i => i.category === 'performance').length;
    
    if (criticalCount > 0) {
      recommendations.push(`Address ${criticalCount} critical issues immediately`);
    }
    
    if (securityCount > 0) {
      recommendations.push(`Security review required - ${securityCount} security issues found`);
    }
    
    if (performanceCount > 0) {
      recommendations.push(`Performance optimization needed - ${performanceCount} performance issues found`);
    }
    
    recommendations.push('Implement automated quality checks in CI/CD pipeline');
    recommendations.push('Consider pair programming for complex changes');
    
    return recommendations;
  }

  private calculateMaintainabilityScore(issues: QualityIssue[]): number {
    const maintainabilityIssues = issues.filter(i => i.category === 'maintainability');
    const complexityIssues = issues.filter(i => i.title.includes('complex'));
    
    let score = 1.0;
    score -= maintainabilityIssues.length * 0.1;
    score -= complexityIssues.length * 0.2;
    
    return Math.max(0, score);
  }

  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private normalizeSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    const lower = severity.toLowerCase();
    if (lower.includes('critical')) return 'critical';
    if (lower.includes('high')) return 'high';
    if (lower.includes('medium')) return 'medium';
    return 'low';
  }

  private normalizeCategory(category: string): QualityIssue['category'] {
    const lower = category.toLowerCase();
    if (lower.includes('security')) return 'security';
    if (lower.includes('performance')) return 'performance';
    if (lower.includes('maintain')) return 'maintainability';
    if (lower.includes('style')) return 'style';
    return 'reliability';
  }

  private extractSeverity(text: string): 'critical' | 'high' | 'medium' | 'low' {
    const lower = text.toLowerCase();
    if (lower.includes('critical')) return 'critical';
    if (lower.includes('high')) return 'high';
    if (lower.includes('medium')) return 'medium';
    return 'low';
  }

  private extractCategory(text: string): QualityIssue['category'] {
    const lower = text.toLowerCase();
    if (lower.includes('security')) return 'security';
    if (lower.includes('performance')) return 'performance';
    if (lower.includes('maintain')) return 'maintainability';
    return 'reliability';
  }

  private estimateEffort(description: string): QualityIssue['effortToFix'] {
    const lower = description.toLowerCase();
    if (lower.includes('refactor') || lower.includes('rewrite')) return 'significant';
    if (lower.includes('complex') || lower.includes('multiple')) return 'major';
    if (lower.includes('simple') || lower.includes('quick')) return 'trivial';
    return 'minor';
  }

  // Placeholder methods for other review types
  private async performQualityAudit(task: Task): Promise<any> {
    // Full quality audit implementation would go here
    return { message: 'Quality audit functionality to be implemented' };
  }

  private async performSecurityReview(task: Task): Promise<any> {
    // Dedicated security review implementation would go here
    return { message: 'Security review functionality to be implemented' };
  }

  private async performPerformanceReview(task: Task): Promise<any> {
    // Performance review implementation would go here
    return { message: 'Performance review functionality to be implemented' };
  }

  private async performAccessibilityReview(task: Task): Promise<any> {
    // Accessibility review implementation would go here
    return { message: 'Accessibility review functionality to be implemented' };
  }

  private async performTestCoverageAnalysis(task: Task): Promise<any> {
    // Test coverage analysis implementation would go here
    return { message: 'Test coverage analysis functionality to be implemented' };
  }

  private async performArchitectureReview(task: Task): Promise<any> {
    // Architecture review implementation would go here
    return { message: 'Architecture review functionality to be implemented' };
  }

  // Common task management methods
  private updateTaskProgress(taskId: string, progress: number, message?: string): void {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.progress = progress;
      this.activeTasks.set(taskId, task);
    }

    MessageQueue.publishProgressUpdate(taskId, progress, message).catch(error => {
      logger.error('Failed to publish progress update from Sarah:', { taskId, error });
    });

    logger.debug('Sarah task progress updated', { taskId, progress, message });
  }

  private async completeTask(taskId: string, result: any): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.result = result;
    task.progress = 100;

    if (task.contextId) {
      await ContextClient.completeTaskContext(task.contextId, result);
    }

    await MessageQueue.publishTaskResult(taskId, result, 'completed');

    this.activeTasks.delete(taskId);
    
    logger.info('Sarah task completed', { taskId, type: task.type, approved: result.approved });
  }

  private async failTask(taskId: string, error: Error): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    task.status = 'failed';
    task.error = error.message;

    if (task.contextId) {
      await ContextClient.failTaskContext(task.contextId, error);
    }

    await MessageQueue.publishTaskResult(taskId, { error: error.message }, 'failed');

    this.activeTasks.delete(taskId);
    
    logger.error('Sarah task failed', { taskId, type: task.type, error: error.message });
  }

  private async handleTaskCancellation(data: any): Promise<void> {
    const { taskId } = data;
    const task = this.activeTasks.get(taskId);
    
    if (task) {
      await this.failTask(taskId, new Error('Task cancelled by request'));
      logger.info('Sarah task cancelled', { taskId });
    }
  }

  private async handleQualityReviewRequest(data: any): Promise<void> {
    // Handle direct quality review requests
    await this.handleTaskExecution({
      ...data,
      type: 'code_review'
    });
  }

  private async handleAdversarialReviewRequest(data: any): Promise<void> {
    // Handle adversarial review requests with extra scrutiny
    await this.handleTaskExecution({
      ...data,
      type: 'code_review',
      adversarialMode: true
    });
  }

  private async handleSecurityScanRequest(data: any): Promise<void> {
    // Handle security scan requests
    await this.handleTaskExecution({
      ...data,
      type: 'security_review'
    });
  }

  private async handleStatusRequest(data: any): Promise<void> {
    const status = {
      agentId: config.agentId,
      agentName: 'Sarah',
      agentType: 'qa',
      persona: 'adversarial_reviewer',
      activeTasks: Array.from(this.activeTasks.values()).map(task => ({
        id: task.id,
        type: task.type,
        status: task.status,
        progress: task.progress,
        startedAt: task.startedAt,
      })),
      capabilities: [
        'adversarial_code_review',
        'security_vulnerability_scanning',
        'performance_analysis',
        'architecture_review',
        'quality_gate_enforcement'
      ],
      qualityStandards: this.qualityStandards,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    logger.info('Sarah status requested', status);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await MessageQueue.sendHeartbeat({
          agentType: 'qa',
          agentName: 'Sarah',
          specialization: 'adversarial_review',
          activeTasks: this.activeTasks.size,
          lastActivity: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Sarah heartbeat failed:', error);
      }
    }, config.health.heartbeatInterval);

    logger.info('Sarah heartbeat started');
  }

  // Public methods for API routes
  public getActiveTasks(): Task[] {
    return Array.from(this.activeTasks.values());
  }

  public getTask(taskId: string): Task | undefined {
    return this.activeTasks.get(taskId);
  }

  public async cancelTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId);
    if (task && task.status === 'in_progress') {
      await this.failTask(taskId, new Error('Task cancelled by user request'));
      return true;
    }
    return false;
  }

  public getReviewStatistics(): any {
    // This would typically come from a database or persistent storage
    // For now, return basic statistics
    const activeTasks = Array.from(this.activeTasks.values());
    const completedTasks = activeTasks.filter(t => t.status === 'completed');
    const failedTasks = activeTasks.filter(t => t.status === 'failed');
    
    return {
      totalReviews: activeTasks.length,
      completedReviews: completedTasks.length,
      failedReviews: failedTasks.length,
      activeReviews: activeTasks.filter(t => t.status === 'in_progress').length,
      averageReviewTime: completedTasks.length > 0 
        ? Math.round(completedTasks.reduce((sum, task) => {
            const duration = task.result?.duration || 0;
            return sum + duration;
          }, 0) / completedTasks.length)
        : 0,
      rejectionRate: completedTasks.length > 0
        ? Math.round((completedTasks.filter(task => !task.result?.approved).length / completedTasks.length) * 100)
        : 0,
      mostCommonIssues: [
        'TypeScript any type usage',
        'Missing error handling',
        'Security vulnerabilities',
        'Performance anti-patterns',
        'Code complexity violations'
      ],
    };
  }

  // Direct method for handling task execution (used by API routes)
  public async executeTaskDirectly(taskData: any): Promise<any> {
    return this.handleTaskExecution(taskData);
  }
}