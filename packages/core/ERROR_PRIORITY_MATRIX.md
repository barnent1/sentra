# SENTRA ERROR PRIORITY MATRIX

## PHASE 1: FOUNDATION FIXES (MUST FIX FIRST)

### 1.1 Root Configuration (3 errors - BLOCKING ALL BUILDS)
**File**: `tsconfig.json`
**Priority**: CRITICAL - STOPS ALL BUILDS

```typescript
// Line 79: error TS6310: Referenced project may not disable emit
// Line 82: error TS6306: Referenced project must have setting "composite": true  
// Line 82: error TS6310: Referenced project may not disable emit
```

**Fix Required**: 
- Set `"composite": true` in mobile package
- Enable emit in dashboard and mobile packages
- Fix project references configuration

### 1.2 TMUX Type Exports (25 errors - CASCADING FAILURES)
**File**: `/packages/core/src/tmux/index.ts`
**Priority**: CRITICAL - BLOCKS TMUX INTEGRATION

Missing exports causing cascade failures:
- `WebSocketClient` (not exported)
- `SubscriptionFilter` (not exported)  
- `BroadcastConfig` (not exported)
- `ActivityStreamConfig` (wrong name)
- `WebSocketStats` (not exported)
- `GridLayoutConfiguration` (not exported)
- `PanelLayout` (not exported)
- `SessionGridLayout` (not exported)
- `ScalingMetrics` (not exported)
- `LoadBalancingConfig` (not exported)
- `PersistenceConfig` (not exported)
- `CLICommandDefinition` (not exported)

**Fix Required**: Add all missing exports to `/packages/core/src/tmux/types.ts`

## PHASE 2: EVOLUTION SYSTEM CORE

### 2.1 Knowledge Transfer Readonly Violations (39 errors - SAME PATTERN)
**File**: `/packages/core/src/evolution/knowledge-transfer.ts`
**Lines**: 1079 (18 errors), 1082 (18 errors)
**Priority**: HIGH - BREAKS DNA EVOLUTION

**Pattern**: Cannot assign to readonly properties:
```typescript
// All failing on these readonly properties:
adaptability, collaborationAffinity, communicationClarity, complexity, 
creativity, empathy, errorRecovery, learningVelocity, novelty, 
patternRecognition, persistence, pragmatism, resourceEfficiency, 
riskTolerance, stability, successRate, thoroughness, transferability
```

**Fix Required**: Implement immutable updates instead of direct assignment

### 2.2 Pattern Type Usage (8 errors)
**Files**: Various evolution files
**Issue**: Using `PatternType` as type instead of value

```typescript
// Wrong:
function evolve(type: PatternType): PatternType 

// Correct:  
function evolve(type: typeof PatternType): typeof PatternType
```

## PHASE 3: API LAYER CRITICAL

### 3.1 Evolution Routes (52 errors - HIGHEST COUNT)
**File**: `/packages/api/src/routes/evolution.ts`
**Primary Issues**:

1. **Unused Imports** (7 errors): Dead code cleanup
2. **Null Safety** (12 errors): `existingPattern` possibly null  
3. **Property Missing** (6 errors): `patternRecognition`, `adaptabilityScore`
4. **Type Mismatches** (8 errors): Branded types vs regular types
5. **Overload Mismatches** (6 errors): Function signature issues

**Critical Lines**:
- Line 95: `existingPattern.isArchived` - property missing
- Lines 111-115: `patternRecognition` property doesn't exist on `GeneticMarkers`
- Line 148-149: `adaptabilityScore` should be `adaptability`

### 3.2 Environment Variable Access (68 TS4111 errors)
**Files**: Multiple API files
**Issue**: Incorrect property access on `process.env`

```typescript
// Wrong:
const port = process.env.PORT

// Correct:
const port = process.env['PORT']
```

## PHASE 4: TYPE ALIGNMENT

### 4.1 Exact Optional Properties (16 errors - TS2375/TS2379)
**Issue**: `exactOptionalPropertyTypes: true` violations
**Files**: Evolution service, metrics service

```typescript
// Problem: undefined not assignable to optional property
taskId: TaskId | undefined  // Wrong

// Solution: Make property truly optional
taskId?: TaskId  // Correct
```

### 4.2 Cross-Package Type Mismatches (6 errors - TS2379) 
**Issue**: Types imported from different packages incompatible

Core evolution types vs Types package exports:
```typescript
// packages/core/src/types/evolution.ts  
projectType: "ai-ml" | "blockchain" | "embedded"  // Extended

// packages/types/dist/index.ts
projectType: "web-app" | "api" | "cli" | "library" | "infrastructure"  // Limited
```

## SEQUENTIAL FIX ORDER

### Agent 1: Root Config Fix
- Fix `tsconfig.json` project references
- Set composite: true in mobile
- Enable emit in dashboard/mobile

### Agent 2: TMUX Types Export  
- Add all missing exports to `/packages/core/src/tmux/types.ts`
- Verify imports resolve correctly

### Agent 3: Knowledge Transfer Immutability
- Replace direct assignments with immutable updates
- Fix all 39 readonly violations in one pass

### Agent 4: Pattern Type Usage
- Fix `PatternType` vs `typeof PatternType` usage
- Update evolution service and pattern matching

### Agent 5: Evolution Routes Major
- Fix null safety checks
- Align property names (`patternRecognition` → correct properties)
- Fix branded type issues

### Agent 6: Environment Variables  
- Fix all TS4111 errors with bracket notation
- Update logger, auth, example files

### Agent 7: Type Alignment
- Align projectType definitions across packages
- Fix exactOptionalPropertyTypes violations

### Agent 8: Code Cleanup
- Remove unused imports (46 TS6133 errors)
- Clean up dead code

## SUCCESS METRICS

- Phase 1 Complete: Build starts successfully
- Phase 2 Complete: Core evolution system compiles  
- Phase 3 Complete: API layer functional
- Phase 4 Complete: All 393 errors resolved

**Total Agents Required**: 8 sequential agents
**Estimated Time**: 8-12 hours total  
**Deployment Ready**: After all phases complete