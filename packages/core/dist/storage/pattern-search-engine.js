/**
 * Pattern Search Engine for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * Provides advanced search and ranking capabilities for evolutionary patterns:
 * - Multi-criteria similarity search with complex filtering
 * - Dynamic relevance scoring algorithms
 * - Caching for frequently accessed patterns
 * - Performance optimization for large datasets
 */
/**
 * Available ranking algorithms
 */
export var RankingAlgorithm;
(function (RankingAlgorithm) {
    RankingAlgorithm["COSINE_SIMILARITY"] = "cosine_similarity";
    RankingAlgorithm["WEIGHTED_EUCLIDEAN"] = "weighted_euclidean";
    RankingAlgorithm["GENETIC_DISTANCE"] = "genetic_distance";
    RankingAlgorithm["PERFORMANCE_BASED"] = "performance_based";
    RankingAlgorithm["CONTEXT_AWARE"] = "context_aware";
    RankingAlgorithm["HYBRID_SCORING"] = "hybrid_scoring";
    RankingAlgorithm["PARETO_OPTIMAL"] = "pareto_optimal";
})(RankingAlgorithm || (RankingAlgorithm = {}));
// ============================================================================
// RELEVANCE SCORING UTILITIES
// ============================================================================
/**
 * Utility class for computing various similarity and relevance scores
 */
export class RelevanceScorer {
    /**
     * Compute genetic marker similarity between patterns
     */
    static computeGeneticSimilarity(pattern1, pattern2, weights) {
        const defaultWeights = {
            complexity: 1.0,
            adaptability: 1.2,
            successRate: 1.5,
            transferability: 1.0,
            stability: 0.8,
            novelty: 0.9,
            patternRecognition: 1.1,
            errorRecovery: 1.0,
            communicationClarity: 0.7,
            learningVelocity: 1.3,
            resourceEfficiency: 1.0,
            collaborationAffinity: 0.8,
            riskTolerance: 0.6,
            thoroughness: 0.9,
            creativity: 1.0,
            persistence: 0.8,
            empathy: 0.6,
            pragmatism: 0.9,
        };
        const finalWeights = { ...defaultWeights, ...weights };
        let weightedSum = 0;
        let totalWeight = 0;
        for (const [key, weight] of Object.entries(finalWeights)) {
            const geneticKey = key;
            const diff = Math.abs(pattern1[geneticKey] - pattern2[geneticKey]);
            const similarity = 1 - diff; // Convert difference to similarity
            weightedSum += similarity * weight;
            totalWeight += weight;
        }
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
    /**
     * Compute performance metrics similarity
     */
    static computePerformanceSimilarity(perf1, perf2) {
        const metrics = [
            { key: 'successRate', weight: 2.0 },
            { key: 'codeQualityScore', weight: 1.5 },
            { key: 'adaptationSpeed', weight: 1.2 },
            { key: 'computationalEfficiency', weight: 1.0 },
            { key: 'throughput', weight: 1.3 },
            { key: 'userSatisfactionRating', weight: 1.8 },
        ];
        let weightedSum = 0;
        let totalWeight = 0;
        for (const { key, weight } of metrics) {
            const val1 = perf1[key];
            const val2 = perf2[key];
            if (val1 !== undefined && val2 !== undefined) {
                const diff = Math.abs(val1 - val2);
                const maxValue = Math.max(val1, val2) || 1;
                const similarity = 1 - (diff / maxValue);
                weightedSum += similarity * weight;
                totalWeight += weight;
            }
        }
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
    /**
     * Compute context similarity (project, tech stack, domain)
     */
    static computeContextSimilarity(context1, context2) {
        let totalSimilarity = 0;
        let factorCount = 0;
        // Project type similarity
        totalSimilarity += context1.projectType === context2.projectType ? 1 : 0;
        factorCount++;
        // Tech stack overlap
        const techOverlap = this.computeArrayOverlap(context1.techStack, context2.techStack);
        totalSimilarity += techOverlap;
        factorCount++;
        // Complexity similarity
        const complexityLevels = ['low', 'medium', 'high', 'enterprise', 'research'];
        const complexity1Index = complexityLevels.indexOf(context1.complexity);
        const complexity2Index = complexityLevels.indexOf(context2.complexity);
        const complexitySimilarity = 1 - Math.abs(complexity1Index - complexity2Index) / complexityLevels.length;
        totalSimilarity += complexitySimilarity;
        factorCount++;
        // Industry domain similarity
        totalSimilarity += context1.industryDomain === context2.industryDomain ? 1 : 0;
        factorCount++;
        // Team size similarity (normalized)
        const teamSizeDiff = Math.abs(context1.teamSize - context2.teamSize);
        const maxTeamSize = Math.max(context1.teamSize, context2.teamSize, 10);
        const teamSizeSimilarity = 1 - (teamSizeDiff / maxTeamSize);
        totalSimilarity += teamSizeSimilarity;
        factorCount++;
        return factorCount > 0 ? totalSimilarity / factorCount : 0;
    }
    /**
     * Compute novelty score based on pattern uniqueness
     */
    static computeNoveltyScore(pattern, existingPatterns) {
        if (existingPatterns.length === 0)
            return 1.0;
        // Find most similar existing pattern
        let maxSimilarity = 0;
        for (const existing of existingPatterns) {
            if (existing.id === pattern.id)
                continue;
            const geneticSim = this.computeGeneticSimilarity(pattern.genetics, existing.genetics);
            const perfSim = this.computePerformanceSimilarity(pattern.performance, existing.performance);
            const contextSim = this.computeContextSimilarity(pattern.context, existing.context);
            const overallSim = (geneticSim + perfSim + contextSim) / 3;
            maxSimilarity = Math.max(maxSimilarity, overallSim);
        }
        // Novelty is inverse of maximum similarity
        return 1 - maxSimilarity;
    }
    /**
     * Compute diversity score for result set
     */
    static computeDiversityScore(patterns) {
        if (patterns.length <= 1)
            return 1.0;
        let totalDistance = 0;
        let pairCount = 0;
        for (let i = 0; i < patterns.length; i++) {
            for (let j = i + 1; j < patterns.length; j++) {
                const patternI = patterns[i];
                const patternJ = patterns[j];
                if (!patternI?.genetics || !patternJ?.genetics || !patternI?.performance || !patternJ?.performance || !patternI?.context || !patternJ?.context)
                    continue;
                const genetic = this.computeGeneticSimilarity(patternI.genetics, patternJ.genetics);
                const performance = this.computePerformanceSimilarity(patternI.performance, patternJ.performance);
                const context = this.computeContextSimilarity(patternI.context, patternJ.context);
                const similarity = (genetic + performance + context) / 3;
                const distance = 1 - similarity;
                totalDistance += distance;
                pairCount++;
            }
        }
        return pairCount > 0 ? totalDistance / pairCount : 0;
    }
    /**
     * Helper: Compute overlap ratio between two arrays
     */
    static computeArrayOverlap(arr1, arr2) {
        if (arr1.length === 0 && arr2.length === 0)
            return 1.0;
        if (arr1.length === 0 || arr2.length === 0)
            return 0.0;
        const set1 = new Set(arr1);
        const set2 = new Set(arr2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return intersection.size / union.size;
    }
}
/**
 * High-performance cache for search results
 */
export class SearchCache {
    cache = new Map();
    defaultTtl;
    maxEntries;
    cleanupTimer;
    constructor(defaultTtl = 3600000, maxEntries = 1000) {
        this.defaultTtl = defaultTtl;
        this.maxEntries = maxEntries;
        // Start cleanup timer
        this.cleanupTimer = setInterval(() => this.cleanup(), 300000); // 5 minutes
    }
    /**
     * Generate cache key from search criteria
     */
    generateCacheKey(criteria) {
        return Buffer.from(JSON.stringify({
            query: this.serializeQuery(criteria.query),
            filters: criteria.filters,
            ranking: criteria.ranking,
            pagination: criteria.pagination,
        })).toString('base64');
    }
    /**
     * Serialize query for consistent hashing
     */
    serializeQuery(query) {
        if ('id' in query) {
            return { id: query.id, patternType: query.patternType };
        }
        else {
            return query;
        }
    }
    /**
     * Get cached results
     */
    get(criteria) {
        const key = this.generateCacheKey(criteria);
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        // Check TTL
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return undefined;
        }
        // Update hit count
        const updatedEntry = {
            ...entry,
            hitCount: entry.hitCount + 1,
        };
        this.cache.set(key, updatedEntry);
        return updatedEntry;
    }
    /**
     * Store results in cache
     */
    set(criteria, results, metrics, ttl) {
        const key = this.generateCacheKey(criteria);
        // Enforce max entries
        if (this.cache.size >= this.maxEntries) {
            this.evictLeastUsed();
        }
        const entry = {
            results,
            metrics,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTtl,
            hitCount: 0,
        };
        this.cache.set(key, entry);
    }
    /**
     * Clear cache
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getStats() {
        let totalHits = 0;
        let totalRequests = 0;
        for (const entry of this.cache.values()) {
            totalHits += entry.hitCount;
            totalRequests += entry.hitCount + 1; // +1 for initial cache
        }
        return {
            entries: this.cache.size,
            hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
            memoryUsageMb: this.estimateMemoryUsage(),
        };
    }
    /**
     * Cleanup expired entries
     */
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }
    /**
     * Evict least used entries when cache is full
     */
    evictLeastUsed() {
        let leastUsedKey;
        let leastHitCount = Infinity;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.hitCount < leastHitCount) {
                leastHitCount = entry.hitCount;
                leastUsedKey = key;
            }
        }
        if (leastUsedKey) {
            this.cache.delete(leastUsedKey);
        }
    }
    /**
     * Estimate memory usage in MB
     */
    estimateMemoryUsage() {
        const estimatedBytesPerEntry = 5000; // Rough estimate
        return (this.cache.size * estimatedBytesPerEntry) / (1024 * 1024);
    }
    /**
     * Cleanup on destruction
     */
    destroy() {
        if (this.cleanupTimer) {
            clearTimeout(this.cleanupTimer);
        }
        this.cache.clear();
    }
}
// ============================================================================
// PATTERN SEARCH ENGINE
// ============================================================================
/**
 * Advanced pattern search engine with caching and performance optimization
 */
export class PatternSearchEngine {
    vectorStore;
    cache;
    defaultWeights;
    constructor(vectorStore, options = {}) {
        this.vectorStore = vectorStore;
        this.cache = new SearchCache(options.cacheConfig?.ttl, options.cacheConfig?.maxEntries);
        this.defaultWeights = {
            genetic: 0.3,
            performance: 0.3,
            context: 0.2,
            semantic: 0.15,
            temporal: 0.05,
            ...options.defaultWeights,
        };
    }
    /**
     * Perform advanced pattern search with ranking and caching
     */
    async searchPatterns(criteria) {
        const startTime = Date.now();
        // Check cache first
        if (criteria.performance.useCache) {
            const cachedEntry = this.cache.get(criteria);
            if (cachedEntry) {
                return {
                    results: cachedEntry.results,
                    metrics: {
                        ...cachedEntry.metrics,
                        cacheHit: true,
                    },
                };
            }
        }
        try {
            // Perform vector search
            const vectorSearchStart = Date.now();
            const queryPattern = await this.prepareQueryPattern(criteria.query);
            const vectorResults = await this.vectorStore.searchSimilarPatterns(queryPattern, {
                limit: criteria.pagination.limit * 3, // Get more for better ranking
                threshold: 0.1, // Lower threshold, we'll rank properly
                filter: criteria.filters,
            });
            const vectorSearchTime = Date.now() - vectorSearchStart;
            // Apply advanced ranking
            const rankingStart = Date.now();
            const rankedResults = await this.rankResults(vectorResults, criteria, queryPattern);
            const rankingTime = Date.now() - rankingStart;
            // Apply pagination
            const paginatedResults = rankedResults.slice(criteria.pagination.offset, criteria.pagination.offset + criteria.pagination.limit);
            const totalTime = Date.now() - startTime;
            const metrics = {
                totalResults: rankedResults.length,
                searchTimeMs: totalTime,
                cacheHit: false,
                algorithmsUsed: criteria.ranking.algorithms,
                filteringTimeMs: 0, // Filtering done in vector store
                rankingTimeMs: rankingTime,
                vectorSearchTimeMs: vectorSearchTime,
            };
            // Cache results if enabled
            if (criteria.performance.useCache && totalTime < criteria.performance.maxSearchTime) {
                this.cache.set(criteria, paginatedResults, metrics, criteria.performance.cacheTimeout);
            }
            return {
                results: paginatedResults,
                metrics,
            };
        }
        catch (error) {
            throw new Error(`Pattern search failed: ${error}`);
        }
    }
    /**
     * Get search cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
    /**
     * Clear search cache
     */
    clearCache() {
        this.cache.clear();
    }
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    /**
     * Prepare query pattern from search criteria
     */
    async prepareQueryPattern(query) {
        if ('id' in query) {
            // Already a CodeDNA pattern
            return query;
        }
        else {
            // Construct a virtual pattern for search
            // Note: In a real implementation, you'd create a proper CodeDNA structure
            throw new Error('Virtual pattern construction not yet implemented');
        }
    }
    /**
     * Apply advanced ranking algorithms to search results
     */
    async rankResults(vectorResults, criteria, queryPattern) {
        const weights = { ...this.defaultWeights, ...criteria.ranking.weights };
        const enhancedResults = [];
        for (let i = 0; i < vectorResults.length; i++) {
            const result = vectorResults[i];
            if (!result?.pattern)
                continue;
            const pattern = result.pattern;
            // Compute detailed similarity scores
            const geneticScore = RelevanceScorer.computeGeneticSimilarity(queryPattern.genetics, pattern.genetics);
            const performanceScore = RelevanceScorer.computePerformanceSimilarity(queryPattern.performance, pattern.performance);
            const contextScore = RelevanceScorer.computeContextSimilarity(queryPattern.context, pattern.context);
            const semanticScore = result.similarity ?? 0;
            // Temporal factor (newer patterns get slight boost)
            const daysSinceCreation = (Date.now() - pattern.timestamp.getTime()) / (1000 * 60 * 60 * 24);
            const temporalScore = Math.max(0, 1 - (daysSinceCreation / 365)); // Decay over a year
            // Compute novelty score
            const allPatterns = vectorResults.map(r => r.pattern);
            const noveltyScore = RelevanceScorer.computeNoveltyScore(pattern, allPatterns);
            // Weighted overall score
            const overallScore = (geneticScore * weights.genetic) +
                (performanceScore * weights.performance) +
                (contextScore * weights.context) +
                (semanticScore * weights.semantic) +
                (temporalScore * weights.temporal) +
                (noveltyScore * criteria.ranking.noveltyBonus);
            enhancedResults.push({
                pattern,
                scores: {
                    overall: overallScore,
                    genetic: geneticScore,
                    performance: performanceScore,
                    context: contextScore,
                    semantic: semanticScore,
                    novelty: noveltyScore,
                    diversity: 0, // Computed later for the full set
                },
                ranking: {
                    position: i + 1,
                    algorithm: RankingAlgorithm.HYBRID_SCORING,
                    confidence: Math.min(overallScore, 1.0),
                },
                explanation: this.generateExplanation(pattern, queryPattern, { genetic: geneticScore, performance: performanceScore, context: contextScore }),
            });
        }
        // Sort by overall score
        enhancedResults.sort((a, b) => b.scores.overall - a.scores.overall);
        // Update positions and compute diversity
        const allPatterns = enhancedResults.map(r => r.pattern);
        const diversityScore = RelevanceScorer.computeDiversityScore(allPatterns);
        return enhancedResults.map((result, index) => ({
            ...result,
            scores: {
                ...result.scores,
                diversity: diversityScore,
            },
            ranking: {
                ...result.ranking,
                position: index + 1,
            },
        }));
    }
    /**
     * Generate human-readable explanation for search result
     */
    generateExplanation(pattern, query, scores) {
        const explanations = [];
        if (scores.genetic > 0.8) {
            explanations.push('Very similar genetic markers');
        }
        else if (scores.genetic > 0.6) {
            explanations.push('Similar genetic characteristics');
        }
        if (scores.performance > 0.8) {
            explanations.push('Excellent performance alignment');
        }
        else if (scores.performance > 0.6) {
            explanations.push('Good performance similarity');
        }
        if (scores.context > 0.8) {
            explanations.push('Highly compatible context');
        }
        else if (scores.context > 0.6) {
            explanations.push('Similar project context');
        }
        if (pattern.context.projectType === query.context.projectType) {
            explanations.push(`Same project type: ${pattern.context.projectType}`);
        }
        if (pattern.generation > query.generation) {
            explanations.push(`More evolved (generation ${pattern.generation})`);
        }
        return explanations.length > 0 ? explanations.join(', ') : 'Basic similarity match';
    }
}
// Export statement removed - classes and types are already exported with their declarations
//# sourceMappingURL=pattern-search-engine.js.map