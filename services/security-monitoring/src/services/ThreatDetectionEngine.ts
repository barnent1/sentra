import { EventEmitter } from 'events';
import geoip from 'geoip-lite';
import useragent from 'useragent';
import { KMeans } from 'ml-kmeans';
import { SimpleLinearRegression } from 'ml-regression';
import natural from 'natural';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { getRedis } from '../utils/redis';
import { AlertService } from './AlertService';
import { MLModelService } from './MLModelService';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIP: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  payload?: any;
  headers?: Record<string, string>;
  geoLocation?: {
    country: string;
    region: string;
    city: string;
    lat: number;
    lon: number;
  };
  userAgentParsed?: {
    browser: string;
    version: string;
    os: string;
    device: string;
  };
  riskScore: number;
  riskFactors: string[];
  metadata: Record<string, any>;
}

export interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  category: 'brute_force' | 'injection' | 'xss' | 'ddos' | 'anomaly' | 'credential_stuffing' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  conditions: {
    field: string;
    operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than' | 'in_range';
    value: any;
    timeWindow?: number; // seconds
    threshold?: number;
  }[];
  actions: string[];
  enabled: boolean;
}

export interface DetectedThreat {
  id: string;
  patternId: string;
  patternName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  sourceEvents: SecurityEvent[];
  sourceIP: string;
  userId?: string;
  description: string;
  riskScore: number;
  detectedAt: string;
  mitigationActions: string[];
  evidence: any[];
}

export interface UserBehaviorProfile {
  userId: string;
  loginHours: number[];
  locations: { country: string; city: string; frequency: number }[];
  devices: { fingerprint: string; userAgent: string; frequency: number }[];
  apiUsage: { endpoint: string; frequency: number; avgResponseTime: number }[];
  failedLoginAttempts: number;
  successfulLogins: number;
  lastUpdated: string;
}

export class ThreatDetectionEngine extends EventEmitter {
  private patterns: Map<string, ThreatPattern> = new Map();
  private userProfiles: Map<string, UserBehaviorProfile> = new Map();
  private eventBuffer: SecurityEvent[] = [];
  private alertService: AlertService;
  private mlModelService: MLModelService;
  private redis: any;

  // Real-time threat detection thresholds
  private readonly BRUTE_FORCE_THRESHOLD = 5; // failed attempts
  private readonly BRUTE_FORCE_WINDOW = 300; // 5 minutes
  private readonly DDOS_THRESHOLD = 1000; // requests per minute
  private readonly ANOMALY_THRESHOLD = 0.7; // ML confidence threshold
  private readonly HIGH_RISK_SCORE = 8;
  private readonly CRITICAL_RISK_SCORE = 9;

  constructor() {
    super();
    this.alertService = new AlertService();
    this.mlModelService = new MLModelService();
    this.redis = getRedis();
    
    this.initializePatterns();
    this.startBackgroundProcessing();
  }

  // Initialize threat detection patterns
  private initializePatterns(): void {
    const patterns: ThreatPattern[] = [
      {
        id: 'brute_force_login',
        name: 'Brute Force Login Attack',
        description: 'Multiple failed login attempts from same IP',
        category: 'brute_force',
        severity: 'high',
        conditions: [
          {
            field: 'eventType',
            operator: 'equals',
            value: 'authentication_failed'
          },
          {
            field: 'sourceIP',
            operator: 'equals',
            value: '${sourceIP}',
            timeWindow: this.BRUTE_FORCE_WINDOW,
            threshold: this.BRUTE_FORCE_THRESHOLD
          }
        ],
        actions: ['block_ip', 'alert_security_team', 'increase_rate_limit'],
        enabled: true
      },
      {
        id: 'sql_injection_attempt',
        name: 'SQL Injection Attack',
        description: 'Potential SQL injection in request parameters',
        category: 'injection',
        severity: 'critical',
        conditions: [
          {
            field: 'payload',
            operator: 'matches',
            value: /(union|select|insert|update|delete|drop|exec|script).*(from|where|into)/gi
          }
        ],
        actions: ['block_request', 'alert_security_team', 'quarantine_session'],
        enabled: true
      },
      {
        id: 'xss_attempt',
        name: 'Cross-Site Scripting Attack',
        description: 'Potential XSS payload detected',
        category: 'xss',
        severity: 'high',
        conditions: [
          {
            field: 'payload',
            operator: 'matches',
            value: /<script[^>]*>.*<\/script>|javascript:|on\w+\s*=/gi
          }
        ],
        actions: ['block_request', 'alert_security_team', 'sanitize_input'],
        enabled: true
      },
      {
        id: 'ddos_detection',
        name: 'Distributed Denial of Service',
        description: 'Unusually high request rate detected',
        category: 'ddos',
        severity: 'critical',
        conditions: [
          {
            field: 'sourceIP',
            operator: 'greater_than',
            value: this.DDOS_THRESHOLD,
            timeWindow: 60 // 1 minute
          }
        ],
        actions: ['rate_limit_ip', 'alert_security_team', 'activate_ddos_protection'],
        enabled: true
      },
      {
        id: 'credential_stuffing',
        name: 'Credential Stuffing Attack',
        description: 'Multiple login attempts with different credentials from same IP',
        category: 'credential_stuffing',
        severity: 'high',
        conditions: [
          {
            field: 'eventType',
            operator: 'equals',
            value: 'authentication_failed'
          },
          {
            field: 'metadata.unique_usernames',
            operator: 'greater_than',
            value: 10,
            timeWindow: 300 // 5 minutes
          }
        ],
        actions: ['block_ip', 'alert_security_team', 'require_captcha'],
        enabled: true
      },
      {
        id: 'privilege_escalation',
        name: 'Privilege Escalation Attempt',
        description: 'Unauthorized attempt to access privileged resources',
        category: 'privilege_escalation',
        severity: 'critical',
        conditions: [
          {
            field: 'statusCode',
            operator: 'equals',
            value: 403
          },
          {
            field: 'endpoint',
            operator: 'matches',
            value: /\/admin|\/api\/admin|\/manage|\/config|\/system/i
          }
        ],
        actions: ['block_user', 'alert_security_team', 'audit_permissions'],
        enabled: true
      },
      {
        id: 'anomalous_login_location',
        name: 'Anomalous Login Location',
        description: 'Login from unusual geographic location',
        category: 'anomaly',
        severity: 'medium',
        conditions: [
          {
            field: 'eventType',
            operator: 'equals',
            value: 'authentication_success'
          },
          {
            field: 'metadata.location_anomaly_score',
            operator: 'greater_than',
            value: 0.8
          }
        ],
        actions: ['alert_user', 'require_mfa', 'log_security_event'],
        enabled: true
      }
    ];

    patterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });

    logger.info('Threat detection patterns initialized', {
      patternCount: patterns.length
    });
  }

  // Process incoming security event
  async processSecurityEvent(event: SecurityEvent): Promise<DetectedThreat[]> {
    try {
      // Enrich event with additional context
      const enrichedEvent = await this.enrichEvent(event);
      
      // Add to event buffer
      this.eventBuffer.push(enrichedEvent);
      
      // Maintain buffer size
      if (this.eventBuffer.length > 10000) {
        this.eventBuffer = this.eventBuffer.slice(-5000);
      }

      // Update user behavior profile
      if (enrichedEvent.userId) {
        await this.updateUserProfile(enrichedEvent);
      }

      // Run pattern matching
      const threats = await this.detectThreats(enrichedEvent);

      // Process detected threats
      for (const threat of threats) {
        await this.processThreat(threat);
      }

      return threats;

    } catch (error) {
      logger.error('Error processing security event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventId: event.id
      });
      return [];
    }
  }

  // Enrich security event with additional context
  private async enrichEvent(event: SecurityEvent): Promise<SecurityEvent> {
    const enriched = { ...event };

    // Add geolocation data
    if (event.sourceIP && event.sourceIP !== '127.0.0.1') {
      const geo = geoip.lookup(event.sourceIP);
      if (geo) {
        enriched.geoLocation = {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          lat: geo.ll[0],
          lon: geo.ll[1]
        };
      }
    }

    // Parse user agent
    if (event.userAgent) {
      const agent = useragent.parse(event.userAgent);
      enriched.userAgentParsed = {
        browser: agent.family,
        version: agent.toVersion(),
        os: agent.os.toString(),
        device: agent.device.toString()
      };
    }

    // Calculate risk score
    enriched.riskScore = await this.calculateRiskScore(enriched);

    // Add metadata
    enriched.metadata = {
      ...enriched.metadata,
      processingTime: Date.now(),
      enrichmentVersion: '1.0'
    };

    return enriched;
  }

  // Calculate risk score for an event
  private async calculateRiskScore(event: SecurityEvent): Promise<number> {
    let score = 0;
    const factors: string[] = [];

    // Base score by event type
    const eventTypeScores: Record<string, number> = {
      'authentication_failed': 3,
      'authentication_success': 1,
      'privilege_escalation': 8,
      'data_access': 2,
      'configuration_change': 6,
      'security_violation': 9
    };

    score += eventTypeScores[event.eventType] || 1;

    // IP reputation scoring
    if (event.sourceIP) {
      const ipRisk = await this.getIPRiskScore(event.sourceIP);
      score += ipRisk;
      if (ipRisk > 0) factors.push('suspicious_ip');
    }

    // Geographic anomaly
    if (event.geoLocation && event.userId) {
      const geoAnomaly = await this.calculateLocationAnomaly(event.userId, event.geoLocation);
      score += geoAnomaly * 3;
      if (geoAnomaly > 0.5) factors.push('location_anomaly');
    }

    // Time-based anomaly
    const timeAnomaly = await this.calculateTimeAnomaly(event.userId, new Date(event.timestamp));
    score += timeAnomaly * 2;
    if (timeAnomaly > 0.5) factors.push('time_anomaly');

    // HTTP status code
    if (event.statusCode) {
      if (event.statusCode >= 400 && event.statusCode < 500) {
        score += 2; // Client error
        factors.push('client_error');
      } else if (event.statusCode >= 500) {
        score += 1; // Server error
        factors.push('server_error');
      }
    }

    // Response time anomaly
    if (event.responseTime && event.responseTime > 5000) {
      score += 1;
      factors.push('slow_response');
    }

    // User agent anomaly
    if (event.userAgent) {
      const uaRisk = this.calculateUserAgentRisk(event.userAgent);
      score += uaRisk;
      if (uaRisk > 0) factors.push('suspicious_user_agent');
    }

    event.riskFactors = factors;
    return Math.min(Math.round(score), 10);
  }

  // Detect threats using pattern matching and ML
  private async detectThreats(event: SecurityEvent): Promise<DetectedThreat[]> {
    const threats: DetectedThreat[] = [];

    // Pattern-based detection
    for (const [patternId, pattern] of this.patterns.entries()) {
      if (!pattern.enabled) continue;

      const matches = await this.evaluatePattern(pattern, event);
      if (matches.isMatch) {
        const threat: DetectedThreat = {
          id: crypto.randomUUID(),
          patternId: pattern.id,
          patternName: pattern.name,
          severity: pattern.severity,
          confidence: matches.confidence,
          sourceEvents: [event],
          sourceIP: event.sourceIP,
          userId: event.userId,
          description: pattern.description,
          riskScore: event.riskScore,
          detectedAt: new Date().toISOString(),
          mitigationActions: pattern.actions,
          evidence: matches.evidence
        };

        threats.push(threat);

        logger.warn('Threat detected', {
          threatId: threat.id,
          patternName: threat.patternName,
          severity: threat.severity,
          sourceIP: threat.sourceIP,
          userId: threat.userId
        });
      }
    }

    // ML-based anomaly detection
    const mlThreats = await this.mlModelService.detectAnomalies(event);
    threats.push(...mlThreats);

    return threats;
  }

  // Evaluate threat pattern against event
  private async evaluatePattern(
    pattern: ThreatPattern,
    event: SecurityEvent
  ): Promise<{ isMatch: boolean; confidence: number; evidence: any[] }> {
    const evidence: any[] = [];
    let matchedConditions = 0;

    for (const condition of pattern.conditions) {
      const result = await this.evaluateCondition(condition, event);
      if (result.matches) {
        matchedConditions++;
        evidence.push({
          condition: condition.field,
          value: result.value,
          expected: condition.value
        });
      }
    }

    const isMatch = matchedConditions === pattern.conditions.length;
    const confidence = matchedConditions / pattern.conditions.length;

    return { isMatch, confidence, evidence };
  }

  // Evaluate individual condition
  private async evaluateCondition(
    condition: any,
    event: SecurityEvent
  ): Promise<{ matches: boolean; value: any }> {
    const fieldValue = this.getFieldValue(event, condition.field);

    switch (condition.operator) {
      case 'equals':
        return {
          matches: fieldValue === condition.value,
          value: fieldValue
        };

      case 'contains':
        return {
          matches: typeof fieldValue === 'string' && fieldValue.includes(condition.value),
          value: fieldValue
        };

      case 'matches':
        const regex = condition.value instanceof RegExp ? condition.value : new RegExp(condition.value);
        return {
          matches: typeof fieldValue === 'string' && regex.test(fieldValue),
          value: fieldValue
        };

      case 'greater_than':
        if (condition.timeWindow && condition.threshold) {
          // Time-based threshold evaluation
          const count = await this.getEventCount(condition.field, condition.value, condition.timeWindow);
          return {
            matches: count > condition.threshold,
            value: count
          };
        } else {
          return {
            matches: typeof fieldValue === 'number' && fieldValue > condition.value,
            value: fieldValue
          };
        }

      case 'less_than':
        return {
          matches: typeof fieldValue === 'number' && fieldValue < condition.value,
          value: fieldValue
        };

      case 'in_range':
        const [min, max] = condition.value;
        return {
          matches: typeof fieldValue === 'number' && fieldValue >= min && fieldValue <= max,
          value: fieldValue
        };

      default:
        return { matches: false, value: fieldValue };
    }
  }

  // Get field value from event using dot notation
  private getFieldValue(event: SecurityEvent, fieldPath: string): any {
    const keys = fieldPath.split('.');
    let value: any = event;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  // Get count of events matching criteria within time window
  private async getEventCount(
    field: string,
    value: any,
    timeWindowSeconds: number
  ): Promise<number> {
    const now = Date.now();
    const windowStart = now - (timeWindowSeconds * 1000);

    return this.eventBuffer.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      const fieldValue = this.getFieldValue(event, field);
      
      return eventTime >= windowStart && 
             eventTime <= now && 
             fieldValue === value;
    }).length;
  }

  // Update user behavior profile
  private async updateUserProfile(event: SecurityEvent): Promise<void> {
    if (!event.userId) return;

    let profile = this.userProfiles.get(event.userId);
    if (!profile) {
      profile = {
        userId: event.userId,
        loginHours: new Array(24).fill(0),
        locations: [],
        devices: [],
        apiUsage: [],
        failedLoginAttempts: 0,
        successfulLogins: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    // Update login hours
    if (event.eventType === 'authentication_success') {
      const hour = new Date(event.timestamp).getHours();
      profile.loginHours[hour]++;
      profile.successfulLogins++;
    } else if (event.eventType === 'authentication_failed') {
      profile.failedLoginAttempts++;
    }

    // Update locations
    if (event.geoLocation) {
      const locationKey = `${event.geoLocation.country}-${event.geoLocation.city}`;
      let location = profile.locations.find(l => `${l.country}-${l.city}` === locationKey);
      if (!location) {
        location = {
          country: event.geoLocation.country,
          city: event.geoLocation.city,
          frequency: 0
        };
        profile.locations.push(location);
      }
      location.frequency++;
    }

    // Update devices
    if (event.userAgent) {
      const deviceFingerprint = crypto
        .createHash('md5')
        .update(event.userAgent)
        .digest('hex');
      
      let device = profile.devices.find(d => d.fingerprint === deviceFingerprint);
      if (!device) {
        device = {
          fingerprint: deviceFingerprint,
          userAgent: event.userAgent,
          frequency: 0
        };
        profile.devices.push(device);
      }
      device.frequency++;
    }

    // Update API usage
    if (event.endpoint) {
      let apiUsage = profile.apiUsage.find(a => a.endpoint === event.endpoint);
      if (!apiUsage) {
        apiUsage = {
          endpoint: event.endpoint,
          frequency: 0,
          avgResponseTime: 0
        };
        profile.apiUsage.push(apiUsage);
      }
      apiUsage.frequency++;
      
      if (event.responseTime) {
        apiUsage.avgResponseTime = (apiUsage.avgResponseTime + event.responseTime) / 2;
      }
    }

    profile.lastUpdated = new Date().toISOString();
    this.userProfiles.set(event.userId, profile);

    // Persist to Redis
    await this.redis.setex(
      `user_profile:${event.userId}`,
      86400 * 30, // 30 days
      JSON.stringify(profile)
    );
  }

  // Calculate location anomaly score
  private async calculateLocationAnomaly(
    userId: string,
    location: { country: string; city: string; lat: number; lon: number }
  ): Promise<number> {
    const profile = this.userProfiles.get(userId);
    if (!profile || profile.locations.length === 0) return 0;

    // Check if location has been seen before
    const knownLocation = profile.locations.find(
      l => l.country === location.country && l.city === location.city
    );

    if (knownLocation) {
      // Known location - lower anomaly score
      return Math.max(0, 1 - (knownLocation.frequency / profile.successfulLogins));
    }

    // Calculate distance from known locations
    const distances = profile.locations.map(l => {
      // Simplified distance calculation (should use proper geospatial calculation)
      return Math.sqrt(
        Math.pow(location.lat - 0, 2) + Math.pow(location.lon - 0, 2)
      );
    });

    const minDistance = Math.min(...distances);
    return Math.min(1, minDistance / 1000); // Normalize to 0-1 scale
  }

  // Calculate time-based anomaly score
  private async calculateTimeAnomaly(userId?: string, timestamp?: Date): Promise<number> {
    if (!userId || !timestamp) return 0;

    const profile = this.userProfiles.get(userId);
    if (!profile) return 0;

    const hour = timestamp.getHours();
    const totalLogins = profile.loginHours.reduce((sum, count) => sum + count, 0);
    
    if (totalLogins === 0) return 0;

    const hourlyProbability = profile.loginHours[hour] / totalLogins;
    return Math.max(0, 1 - (hourlyProbability * 24)); // Invert probability
  }

  // Calculate user agent risk score
  private calculateUserAgentRisk(userAgent: string): number {
    let risk = 0;

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /curl/i,
      /wget/i,
      /bot/i,
      /spider/i,
      /crawler/i,
      /python/i,
      /script/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        risk += 2;
      }
    }

    // Check for missing common browser strings
    if (!/Mozilla/i.test(userAgent) && !/Chrome|Firefox|Safari|Edge/i.test(userAgent)) {
      risk += 1;
    }

    return Math.min(risk, 5);
  }

  // Get IP risk score from threat intelligence
  private async getIPRiskScore(ip: string): Promise<number> {
    try {
      // Check Redis cache first
      const cached = await this.redis.get(`ip_risk:${ip}`);
      if (cached) {
        return parseInt(cached, 10);
      }

      // TODO: Integrate with threat intelligence feeds
      // For now, return 0 for private/local IPs and small random score for others
      if (this.isPrivateIP(ip)) {
        return 0;
      }

      const risk = Math.random() > 0.95 ? Math.floor(Math.random() * 3) : 0;
      await this.redis.setex(`ip_risk:${ip}`, 3600, risk.toString());

      return risk;
    } catch (error) {
      logger.error('Error getting IP risk score', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip
      });
      return 0;
    }
  }

  // Check if IP is private/local
  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^::1$/,
      /^fe80:/
    ];

    return privateRanges.some(range => range.test(ip));
  }

  // Process detected threat
  private async processThreat(threat: DetectedThreat): Promise<void> {
    try {
      // Log threat
      logger.error('Security threat detected', {
        threatId: threat.id,
        patternName: threat.patternName,
        severity: threat.severity,
        sourceIP: threat.sourceIP,
        userId: threat.userId,
        riskScore: threat.riskScore
      });

      // Execute mitigation actions
      for (const action of threat.mitigationActions) {
        await this.executeMitigationAction(action, threat);
      }

      // Send alerts based on severity
      if (threat.severity === 'critical' || threat.riskScore >= this.CRITICAL_RISK_SCORE) {
        await this.alertService.sendCriticalAlert(threat);
      } else if (threat.severity === 'high' || threat.riskScore >= this.HIGH_RISK_SCORE) {
        await this.alertService.sendHighPriorityAlert(threat);
      } else {
        await this.alertService.sendStandardAlert(threat);
      }

      // Emit threat event for real-time processing
      this.emit('threat_detected', threat);

    } catch (error) {
      logger.error('Error processing threat', {
        error: error instanceof Error ? error.message : 'Unknown error',
        threatId: threat.id
      });
    }
  }

  // Execute mitigation action
  private async executeMitigationAction(action: string, threat: DetectedThreat): Promise<void> {
    switch (action) {
      case 'block_ip':
        await this.blockIP(threat.sourceIP, 3600); // Block for 1 hour
        break;
      
      case 'block_user':
        if (threat.userId) {
          await this.blockUser(threat.userId, 1800); // Block for 30 minutes
        }
        break;
      
      case 'rate_limit_ip':
        await this.applyRateLimit(threat.sourceIP, 10, 60); // 10 requests per minute
        break;
      
      case 'require_mfa':
        if (threat.userId) {
          await this.requireMFA(threat.userId);
        }
        break;
      
      case 'quarantine_session':
        // TODO: Implement session quarantine
        break;
      
      default:
        logger.warn('Unknown mitigation action', { action, threatId: threat.id });
    }
  }

  // Mitigation action implementations
  private async blockIP(ip: string, durationSeconds: number): Promise<void> {
    await this.redis.setex(`blocked_ip:${ip}`, durationSeconds, 'blocked');
    logger.info('IP blocked', { ip, duration: durationSeconds });
  }

  private async blockUser(userId: string, durationSeconds: number): Promise<void> {
    await this.redis.setex(`blocked_user:${userId}`, durationSeconds, 'blocked');
    logger.info('User blocked', { userId, duration: durationSeconds });
  }

  private async applyRateLimit(ip: string, limit: number, windowSeconds: number): Promise<void> {
    await this.redis.setex(`rate_limit:${ip}`, windowSeconds, limit.toString());
    logger.info('Rate limit applied', { ip, limit, window: windowSeconds });
  }

  private async requireMFA(userId: string): Promise<void> {
    await this.redis.setex(`require_mfa:${userId}`, 86400, 'required'); // 24 hours
    logger.info('MFA required for user', { userId });
  }

  // Background processing
  private startBackgroundProcessing(): void {
    // Clean old events every 5 minutes
    setInterval(() => {
      const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      this.eventBuffer = this.eventBuffer.filter(
        event => new Date(event.timestamp).getTime() > cutoff
      );
    }, 5 * 60 * 1000);

    // Update ML models every hour
    setInterval(async () => {
      try {
        await this.mlModelService.updateModels(this.eventBuffer);
        logger.info('ML models updated');
      } catch (error) {
        logger.error('Failed to update ML models', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, 60 * 60 * 1000);

    logger.info('Background processing started');
  }
}