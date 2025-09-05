/**
 * Vector-based Pattern Matching System for Cross-Project Learning
 *
 * This module provides vector similarity matching for DNA patterns,
 * enabling intelligent cross-project knowledge transfer and learning.
 *
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import { PatternType } from '../types';
// ============================================================================
// VECTOR OPERATIONS IMPLEMENTATION
// ============================================================================
export class VectorOperations {
    /**
     * Compute cosine similarity between two vectors
     */
    cosineSimilarity(a, b) {
        if (a.length !== b.length) {
            throw new Error('Vectors must have the same dimensions');
        }
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);
        if (normA === 0 || normB === 0) {
            return 0;
        }
        return dotProduct / (normA * normB);
    }
    /**
     * Compute Euclidean distance between vectors
     */
    euclideanDistance(a, b) {
        if (a.length !== b.length) {
            throw new Error('Vectors must have the same dimensions');
        }
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            const diff = a[i] - b[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }
    /**
     * Normalize vector to unit length
     */
    normalize(vector) {
        let norm = 0;
        for (let i = 0; i < vector.length; i++) {
            norm += vector[i] * vector[i];
        }
        norm = Math.sqrt(norm);
        if (norm === 0) {
            return vector; // Return original if zero vector
        }
        const normalized = Array.from(vector).map(val => val / norm);
        return normalized;
    }
    /**
     * Find most similar vectors in a collection
     */
    findSimilar(query, candidates, topK, threshold) {
        const similarities = candidates.map((candidate, index) => ({
            vector: candidate,
            similarity: this.cosineSimilarity(query, candidate),
            index,
        }));
        // Filter by threshold if provided
        const filtered = threshold
            ? similarities.filter(item => item.similarity >= threshold)
            : similarities;
        // Sort by similarity (descending) and take top K
        return filtered
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);
    }
    /**
     * Generate embedding for DNA pattern
     */
    async generateDnaEmbedding(dna) {
        // Create a comprehensive embedding from DNA characteristics
        const features = [];
        // Genetic markers (normalized to 0-1)
        const geneticValues = Object.values(dna.genetics);
        features.push(...geneticValues);
        // Performance metrics (normalized)
        const performanceFeatures = [
            dna.performance.successRate,
            dna.performance.codeQualityScore,
            dna.performance.errorRecoveryRate,
            dna.performance.adaptationSpeed,
            dna.performance.computationalEfficiency,
            dna.performance.userSatisfactionRating,
            dna.performance.maintainabilityScore,
            dna.performance.communicationEffectiveness,
            dna.performance.teamIntegration,
            // Normalize time-based metrics
            Math.min(1, 60000 / dna.performance.averageTaskCompletionTime), // Faster = higher score
            Math.min(1, 1000 / dna.performance.responseLatency), // Lower latency = higher score
            Math.min(1, dna.performance.throughput / 10), // Normalize throughput
            Math.max(0, 1 - dna.performance.bugIntroductionRate), // Fewer bugs = higher score
        ];
        features.push(...performanceFeatures);
        // Context features
        const contextFeatures = this.encodeContext(dna.context);
        features.push(...contextFeatures);
        // Pattern type encoding (one-hot)
        const patternTypes = Object.values(PatternType);
        const patternEncoding = patternTypes.map(type => type === dna.patternType ? 1 : 0);
        features.push(...patternEncoding);
        // Generation and fitness
        features.push(Math.min(1, dna.generation / 100), // Normalize generation
        dna.fitnessScore, dna.activationCount > 0 ? Math.min(1, dna.activationCount / 100) : 0);
        // Pad or truncate to desired dimensions (1536 to match typical embedding size)
        const targetDim = 1536;
        if (features.length < targetDim) {
            // Pad with zeros
            features.push(...new Array(targetDim - features.length).fill(0));
        }
        else if (features.length > targetDim) {
            // Truncate
            features.splice(targetDim);
        }
        return features;
    }
    /**
     * Find similar DNA patterns based on embeddings
     */
    async findSimilarDna(queryDna, candidates, threshold = 0.7) {
        const queryEmbedding = await this.generateDnaEmbedding(queryDna);
        const similarities = [];
        for (const candidate of candidates) {
            if (candidate.id === queryDna.id)
                continue; // Skip self
            const candidateEmbedding = await this.generateDnaEmbedding(candidate);
            const similarity = this.cosineSimilarity(queryEmbedding, candidateEmbedding);
            if (similarity >= threshold) {
                similarities.push({ dna: candidate, similarity });
            }
        }
        return similarities.sort((a, b) => b.similarity - a.similarity);
    }
    /**
     * Cluster DNA patterns by similarity
     */
    async clusterDnaPatterns(dnaCollection, numClusters) {
        if (dnaCollection.length === 0 || numClusters <= 0) {
            return [];
        }
        if (dnaCollection.length <= numClusters) {
            return dnaCollection.map(dna => [dna]);
        }
        // Generate embeddings for all DNA patterns
        const embeddings = await Promise.all(dnaCollection.map(async (dna) => ({
            dna,
            embedding: await this.generateDnaEmbedding(dna),
        })));
        // Simple k-means clustering implementation
        const clusters = this.kMeansClustering(embeddings, numClusters);
        return clusters;
    }
    encodeContext(context) {
        const features = [];
        // Project type encoding (one-hot)
        const projectTypes = ['web-app', 'api', 'cli', 'library', 'infrastructure', 'ai-ml', 'blockchain', 'embedded'];
        features.push(...projectTypes.map(type => type === context.projectType ? 1 : 0));
        // Complexity encoding
        const complexityLevels = ['low', 'medium', 'high', 'enterprise', 'research'];
        features.push(...complexityLevels.map(level => level === context.complexity ? 1 : 0));
        // Tech stack encoding (simplified - use common technologies)
        const commonTech = ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'react', 'vue', 'angular', 'node', 'express', 'fastapi', 'spring', 'docker', 'kubernetes'];
        features.push(...commonTech.map(tech => context.techStack.some(t => t.toLowerCase().includes(tech)) ? 1 : 0));
        // Numerical features
        features.push(Math.min(1, context.teamSize / 20), // Normalize team size
        context.performanceRequirements.maxResponseTime > 0 ? Math.min(1, 5000 / context.performanceRequirements.maxResponseTime) : 0, context.performanceRequirements.availabilityTarget, Math.min(1, context.scalabilityNeeds.expectedGrowthRate / 5));
        return features;
    }
    kMeansClustering(embeddings, k) {
        const maxIterations = 100;
        const tolerance = 1e-4;
        // Initialize centroids randomly
        let centroids = this.initializeCentroids(embeddings, k);
        for (let iter = 0; iter < maxIterations; iter++) {
            // Assign each point to the nearest centroid
            const clusters = Array.from({ length: k }, () => []);
            for (const item of embeddings) {
                let minDistance = Infinity;
                let closestCluster = 0;
                for (let i = 0; i < centroids.length; i++) {
                    const distance = this.euclideanDistance(item.embedding, centroids[i]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCluster = i;
                    }
                }
                clusters[closestCluster].push(item.dna);
            }
            // Update centroids
            const newCentroids = this.updateCentroids(clusters, embeddings);
            // Check for convergence
            const converged = this.checkConvergence(centroids, newCentroids, tolerance);
            centroids = newCentroids;
            if (converged)
                break;
        }
        // Final cluster assignment
        const finalClusters = Array.from({ length: k }, () => []);
        for (const item of embeddings) {
            let minDistance = Infinity;
            let closestCluster = 0;
            for (let i = 0; i < centroids.length; i++) {
                const distance = this.euclideanDistance(item.embedding, centroids[i]);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestCluster = i;
                }
            }
            finalClusters[closestCluster].push(item.dna);
        }
        return finalClusters.filter(cluster => cluster.length > 0);
    }
    initializeCentroids(embeddings, k) {
        const centroids = [];
        const used = new Set();
        // Use k-means++ initialization for better results
        if (embeddings.length > 0) {
            // Choose first centroid randomly
            const firstIndex = Math.floor(Math.random() * embeddings.length);
            centroids.push(embeddings[firstIndex].embedding);
            used.add(firstIndex);
            // Choose remaining centroids
            for (let i = 1; i < k && i < embeddings.length; i++) {
                const distances = [];
                for (let j = 0; j < embeddings.length; j++) {
                    if (used.has(j)) {
                        distances.push(0);
                        continue;
                    }
                    let minDistToCentroid = Infinity;
                    for (const centroid of centroids) {
                        const dist = this.euclideanDistance(embeddings[j].embedding, centroid);
                        minDistToCentroid = Math.min(minDistToCentroid, dist);
                    }
                    distances.push(minDistToCentroid * minDistToCentroid); // Square for probability weighting
                }
                // Choose next centroid based on weighted probability
                const totalDistance = distances.reduce((sum, d) => sum + d, 0);
                let random = Math.random() * totalDistance;
                for (let j = 0; j < distances.length; j++) {
                    if (used.has(j))
                        continue;
                    random -= distances[j];
                    if (random <= 0) {
                        centroids.push(embeddings[j].embedding);
                        used.add(j);
                        break;
                    }
                }
            }
        }
        return centroids;
    }
    updateCentroids(clusters, embeddings) {
        return clusters.map(cluster => {
            if (cluster.length === 0) {
                // Return a random embedding if cluster is empty
                const randomIndex = Math.floor(Math.random() * embeddings.length);
                return embeddings[randomIndex].embedding;
            }
            // Calculate centroid as average of cluster members
            const embeddingMap = new Map();
            for (const item of embeddings) {
                embeddingMap.set(item.dna.id, item.embedding);
            }
            const clusterEmbeddings = cluster.map(dna => embeddingMap.get(dna.id));
            const centroid = new Array(clusterEmbeddings[0].length).fill(0);
            for (const embedding of clusterEmbeddings) {
                for (let i = 0; i < embedding.length; i++) {
                    centroid[i] += embedding[i];
                }
            }
            return centroid.map(sum => sum / clusterEmbeddings.length);
        });
    }
    checkConvergence(oldCentroids, newCentroids, tolerance) {
        if (oldCentroids.length !== newCentroids.length)
            return false;
        for (let i = 0; i < oldCentroids.length; i++) {
            const distance = this.euclideanDistance(oldCentroids[i], newCentroids[i]);
            if (distance > tolerance) {
                return false;
            }
        }
        return true;
    }
}
// ============================================================================
// PATTERN MATCHING SERVICE
// ============================================================================
export class PatternMatchingService {
    config;
    vectorOps;
    patternEmbeddingCache = new Map();
    constructor(config = {}) {
        this.config = {
            embeddingDimensions: 1536,
            similarityThreshold: 0.7,
            contextWeight: 0.3,
            geneticWeight: 0.4,
            performanceWeight: 0.3,
            diversityWeight: 0.2,
            maxClusters: 10,
            adaptationRiskThreshold: 0.7,
            ...config,
        };
        this.vectorOps = new VectorOperations();
    }
    /**
     * Find patterns similar to the given DNA pattern
     */
    async findSimilarPatterns(queryDna, candidatePatterns, maxResults = 10) {
        const results = [];
        for (const candidate of candidatePatterns) {
            if (candidate.id === queryDna.id)
                continue;
            const similarity = await this.calculatePatternSimilarity(queryDna, candidate);
            if (similarity.overallScore >= this.config.similarityThreshold) {
                results.push(similarity);
            }
        }
        return results
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, maxResults);
    }
    /**
     * Calculate detailed similarity between two DNA patterns
     */
    async calculatePatternSimilarity(sourcePattern, targetPattern) {
        // Vector similarity
        const sourceEmbedding = await this.getOrGenerateEmbedding(sourcePattern);
        const targetEmbedding = await this.getOrGenerateEmbedding(targetPattern);
        const vectorSimilarity = this.vectorOps.cosineSimilarity(sourceEmbedding, targetEmbedding);
        // Context compatibility
        const contextCompatibility = this.calculateContextCompatibility(sourcePattern.context, targetPattern.context);
        // Genetic alignment
        const geneticAlignment = this.calculateGeneticAlignment(sourcePattern.genetics, targetPattern.genetics);
        // Performance alignment
        const performanceAlignment = this.calculatePerformanceAlignment(sourcePattern.performance, targetPattern.performance);
        // Calculate weighted overall score
        const overallScore = (vectorSimilarity * 0.3 +
            contextCompatibility * this.config.contextWeight +
            geneticAlignment * this.config.geneticWeight +
            performanceAlignment * this.config.performanceWeight);
        // Calculate transfer potential
        const transferPotential = this.calculateTransferPotential(sourcePattern, targetPattern, overallScore);
        // Generate reasoning
        const reasoning = this.generateSimilarityReasoning(vectorSimilarity, contextCompatibility, geneticAlignment, performanceAlignment, overallScore);
        return {
            sourcePattern,
            targetPattern,
            similarity: vectorSimilarity,
            contextCompatibility,
            geneticAlignment,
            performanceAlignment,
            overallScore,
            transferPotential,
            reasoning,
        };
    }
    /**
     * Generate transfer candidates for cross-project learning
     */
    async generateTransferCandidates(sourceDna, targetProjectId, candidateProjects) {
        const candidates = [];
        for (const project of candidateProjects) {
            if (project.projectId === targetProjectId)
                continue;
            for (const pattern of project.patterns) {
                const similarity = await this.calculatePatternSimilarity(sourceDna, pattern);
                if (similarity.overallScore >= this.config.similarityThreshold) {
                    const candidate = await this.createTransferCandidate(sourceDna, targetProjectId, similarity);
                    candidates.push(candidate);
                }
            }
        }
        return candidates.sort((a, b) => b.expectedOutcome.fitnessImprovement - a.expectedOutcome.fitnessImprovement);
    }
    /**
     * Cluster DNA patterns for analysis
     */
    async clusterPatterns(patterns, numClusters) {
        const k = numClusters ?? Math.min(this.config.maxClusters, Math.max(2, Math.floor(patterns.length / 5)));
        const rawClusters = await this.vectorOps.clusterDnaPatterns(patterns, k);
        const clusters = [];
        for (let i = 0; i < rawClusters.length; i++) {
            const clusterPatterns = rawClusters[i];
            if (clusterPatterns.length === 0)
                continue;
            const cluster = await this.analyzeCluster(clusterPatterns, i);
            clusters.push(cluster);
        }
        return clusters;
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    async getOrGenerateEmbedding(dna) {
        let embedding = this.patternEmbeddingCache.get(dna.id);
        if (!embedding) {
            const generated = await this.vectorOps.generateDnaEmbedding(dna);
            embedding = generated;
            this.patternEmbeddingCache.set(dna.id, embedding);
        }
        return embedding;
    }
    calculateContextCompatibility(context1, context2) {
        let compatibility = 0;
        // Project type compatibility
        if (context1.projectType === context2.projectType) {
            compatibility += 0.4;
        }
        else {
            // Partial compatibility for related types
            const relatedTypes = {
                'web-app': ['api', 'library'],
                'api': ['web-app', 'library'],
                'cli': ['library'],
                'library': ['web-app', 'api', 'cli'],
            };
            if (relatedTypes[context1.projectType]?.includes(context2.projectType)) {
                compatibility += 0.2;
            }
        }
        // Technology stack overlap
        const commonTech = context1.techStack.filter(tech => context2.techStack.includes(tech));
        const techCompatibility = commonTech.length / Math.max(context1.techStack.length, context2.techStack.length, 1);
        compatibility += techCompatibility * 0.3;
        // Complexity compatibility
        const complexityLevels = ['low', 'medium', 'high', 'enterprise', 'research'];
        const complexityDistance = Math.abs(complexityLevels.indexOf(context1.complexity) -
            complexityLevels.indexOf(context2.complexity));
        compatibility += (1 - complexityDistance / 4) * 0.2;
        // Team size compatibility
        const teamSizeRatio = Math.min(context1.teamSize, context2.teamSize) /
            Math.max(context1.teamSize, context2.teamSize, 1);
        compatibility += teamSizeRatio * 0.1;
        return Math.max(0, Math.min(1, compatibility));
    }
    calculateGeneticAlignment(genetics1, genetics2) {
        const keys = Object.keys(genetics1);
        let totalAlignment = 0;
        for (const key of keys) {
            const val1 = genetics1[key];
            const val2 = genetics2[key];
            const alignment = 1 - Math.abs(val1 - val2);
            totalAlignment += alignment;
        }
        return totalAlignment / keys.length;
    }
    calculatePerformanceAlignment(perf1, perf2) {
        const keyMetrics = [
            'successRate',
            'codeQualityScore',
            'errorRecoveryRate',
            'adaptationSpeed',
            'userSatisfactionRating',
            'computationalEfficiency',
            'maintainabilityScore',
        ];
        let totalAlignment = 0;
        for (const metric of keyMetrics) {
            const val1 = perf1[metric];
            const val2 = perf2[metric];
            const alignment = 1 - Math.abs(val1 - val2);
            totalAlignment += alignment;
        }
        return totalAlignment / keyMetrics.length;
    }
    calculateTransferPotential(sourcePattern, targetPattern, similarity) {
        // Higher similarity, better fitness, and lower generation gap = higher potential
        const fitnessGap = Math.abs(sourcePattern.fitnessScore - targetPattern.fitnessScore);
        const generationGap = Math.abs(sourcePattern.generation - targetPattern.generation);
        const potential = (similarity * 0.4 +
            (1 - fitnessGap) * 0.3 +
            (1 - Math.min(1, generationGap / 20)) * 0.3);
        return Math.max(0, Math.min(1, potential));
    }
    generateSimilarityReasoning(vectorSim, contextComp, geneticAlign, perfAlign, overall) {
        const reasons = [];
        if (vectorSim > 0.8)
            reasons.push('high vector similarity');
        else if (vectorSim > 0.6)
            reasons.push('moderate vector similarity');
        if (contextComp > 0.7)
            reasons.push('compatible project contexts');
        else if (contextComp > 0.5)
            reasons.push('somewhat compatible contexts');
        if (geneticAlign > 0.8)
            reasons.push('closely aligned genetic markers');
        if (perfAlign > 0.7)
            reasons.push('similar performance characteristics');
        if (overall > 0.8)
            return `Strong match: ${reasons.join(', ')}`;
        else if (overall > 0.6)
            return `Good match: ${reasons.join(', ')}`;
        else
            return `Moderate match: ${reasons.join(', ')}`;
    }
    async createTransferCandidate(sourceDna, targetProjectId, similarity) {
        // Calculate required genetic modifications
        const geneticModifications = {};
        const keys = Object.keys(sourceDna.genetics);
        for (const key of keys) {
            const sourceValue = sourceDna.genetics[key];
            const targetValue = similarity.targetPattern.genetics[key];
            if (Math.abs(sourceValue - targetValue) > 0.1) {
                geneticModifications[key] = targetValue - sourceValue;
            }
        }
        // Calculate risk level
        const modificationCount = Object.keys(geneticModifications).length;
        const avgModification = Object.values(geneticModifications)
            .reduce((sum, val) => sum + Math.abs(val), 0) / Math.max(1, modificationCount);
        let riskLevel;
        if (avgModification < 0.2)
            riskLevel = 'low';
        else if (avgModification < 0.4)
            riskLevel = 'medium';
        else
            riskLevel = 'high';
        // Calculate expected outcomes
        const fitnessImprovement = similarity.transferPotential * 0.1; // Conservative estimate
        const confidence = similarity.overallScore * 0.8; // Reduce confidence for transfer
        const timeline = riskLevel === 'low' ? 60000 : riskLevel === 'medium' ? 300000 : 900000; // 1min, 5min, 15min
        return {
            id: `transfer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            sourceDnaId: sourceDna.id,
            targetProjectId,
            similarity: similarity.overallScore,
            adaptationRequired: {
                geneticModifications,
                contextualChanges: this.identifyContextualChanges(sourceDna.context, similarity.targetPattern.context),
                riskLevel,
            },
            expectedOutcome: {
                fitnessImprovement,
                confidence,
                timeline,
            },
        };
    }
    identifyContextualChanges(sourceContext, targetContext) {
        const changes = [];
        if (sourceContext.projectType !== targetContext.projectType) {
            changes.push(`Project type change: ${sourceContext.projectType} → ${targetContext.projectType}`);
        }
        if (sourceContext.complexity !== targetContext.complexity) {
            changes.push(`Complexity change: ${sourceContext.complexity} → ${targetContext.complexity}`);
        }
        const newTech = targetContext.techStack.filter(tech => !sourceContext.techStack.includes(tech));
        const removedTech = sourceContext.techStack.filter(tech => !targetContext.techStack.includes(tech));
        if (newTech.length > 0) {
            changes.push(`New technologies: ${newTech.join(', ')}`);
        }
        if (removedTech.length > 0) {
            changes.push(`Removed technologies: ${removedTech.join(', ')}`);
        }
        if (Math.abs(sourceContext.teamSize - targetContext.teamSize) > 2) {
            changes.push(`Team size change: ${sourceContext.teamSize} → ${targetContext.teamSize}`);
        }
        return changes;
    }
    async analyzeCluster(patterns, clusterId) {
        // Calculate centroid embedding
        const embeddings = await Promise.all(patterns.map(p => this.getOrGenerateEmbedding(p)));
        const centroid = this.calculateCentroid(embeddings);
        // Analyze dominant characteristics
        const patternTypes = patterns.map(p => p.patternType);
        const dominantPatternType = this.getMostFrequent(patternTypes);
        const avgGeneration = patterns.reduce((sum, p) => sum + p.generation, 0) / patterns.length;
        const avgFitness = patterns.reduce((sum, p) => sum + p.fitnessScore, 0) / patterns.length;
        const allTechStack = patterns.flatMap(p => p.context.techStack);
        const commonTechStack = this.getMostFrequentItems(allTechStack, 3);
        const contextTypes = patterns.map(p => p.context.projectType);
        const uniqueContextTypes = [...new Set(contextTypes)];
        // Calculate diversity
        const diversity = this.calculateClusterDiversity(patterns);
        return {
            id: `cluster_${clusterId}`,
            centroid: centroid,
            patterns,
            dominantCharacteristics: {
                patternType: dominantPatternType,
                avgGeneration,
                avgFitness,
                commonTechStack,
                contextTypes: uniqueContextTypes,
            },
            diversity,
        };
    }
    calculateCentroid(embeddings) {
        if (embeddings.length === 0)
            return [];
        const dimensions = embeddings[0].length;
        const centroid = new Array(dimensions).fill(0);
        for (const embedding of embeddings) {
            for (let i = 0; i < dimensions; i++) {
                centroid[i] += embedding[i];
            }
        }
        return centroid.map(sum => sum / embeddings.length);
    }
    getMostFrequent(items) {
        const counts = new Map();
        for (const item of items) {
            counts.set(item, (counts.get(item) ?? 0) + 1);
        }
        let mostFrequent = items[0];
        let maxCount = 0;
        for (const [item, count] of counts) {
            if (count > maxCount) {
                maxCount = count;
                mostFrequent = item;
            }
        }
        return mostFrequent;
    }
    getMostFrequentItems(items, limit) {
        const counts = new Map();
        for (const item of items) {
            counts.set(item, (counts.get(item) ?? 0) + 1);
        }
        return Array.from(counts.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([item]) => item);
    }
    calculateClusterDiversity(patterns) {
        if (patterns.length < 2)
            return 0;
        let totalDistance = 0;
        let comparisons = 0;
        for (let i = 0; i < patterns.length; i++) {
            for (let j = i + 1; j < patterns.length; j++) {
                totalDistance += this.calculateGeneticDistance(patterns[i].genetics, patterns[j].genetics);
                comparisons++;
            }
        }
        return comparisons > 0 ? totalDistance / comparisons : 0;
    }
    calculateGeneticDistance(genetics1, genetics2) {
        const keys = Object.keys(genetics1);
        let totalDistance = 0;
        for (const key of keys) {
            const val1 = genetics1[key];
            const val2 = genetics2[key];
            totalDistance += Math.abs(val1 - val2);
        }
        return totalDistance / keys.length;
    }
    /**
     * Clear embedding cache to free memory
     */
    clearCache() {
        this.patternEmbeddingCache.clear();
    }
}
export default PatternMatchingService;
//# sourceMappingURL=pattern-matching.js.map