# Spec Versioning System Design

## Overview

A comprehensive versioning system for project specifications that enables:
- Natural conversation-driven spec creation
- Iterative refinement with version history
- Multiple specs per project
- Intelligent version detection and management
- Seamless approval workflow

## Directory Structure

```
.sentra/specs/
  {project-name}/
    {descriptive-name}.spec.{YYYYMMDD}.md          # Initial version
    {descriptive-name}.spec.{YYYYMMDD}.v2.md       # Same-day revision
    {descriptive-name}.spec.{YYYYMMDD}.v3.md       # Another same-day revision
    {other-feature}.spec.{YYYYMMDD}.md             # Different feature
    {descriptive-name}.spec.{YYYYMMDD+1}.md        # Next day major revision
    .metadata/
      {descriptive-name}.json                       # Metadata for spec family
```

### Example

```
.sentra/specs/
  tic-tac-toe/
    tic-tac-toe-application.spec.20251113.md
    tic-tac-toe-application.spec.20251113.v2.md
    tic-tac-toe-multiplayer.spec.20251114.md
    tic-tac-toe-ai-opponent.spec.20251114.md
    tic-tac-toe-application.spec.20251115.md
    .metadata/
      tic-tac-toe-application.json
      tic-tac-toe-multiplayer.json
      tic-tac-toe-ai-opponent.json
```

## Filename Format

**Pattern**: `{descriptive-name}.spec.{YYYYMMDD}[.v{N}].md`

**Components**:
- `{descriptive-name}`: Kebab-case slug from spec title
- `.spec.`: Fixed identifier
- `{YYYYMMDD}`: ISO 8601 date (e.g., 20251113)
- `[.v{N}]`: Optional version suffix for same-day revisions (v2, v3, ...)
- `.md`: Markdown extension

**Generation Rules**:
1. Extract title from first `# Heading` in markdown
2. Convert to kebab-case (lowercase, hyphens)
3. Sanitize special characters
4. Truncate to 50 characters max
5. Use "untitled-spec" if no heading found

**Example Conversions**:
- "Tic Tac Toe Application" → `tic-tac-toe-application`
- "User Authentication System" → `user-authentication-system`
- "Payment Gateway Integration (Stripe)" → `payment-gateway-integration-stripe`

## Metadata Structure

Each spec family (base name) has a JSON metadata file:

```json
{
  "id": "tic-tac-toe-application",
  "title": "Tic Tac Toe Application",
  "project": "tic-tac-toe",
  "created": "2025-11-13T14:30:00Z",
  "updated": "2025-11-13T15:45:00Z",
  "versions": [
    {
      "version": 1,
      "file": "tic-tac-toe-application.spec.20251113.md",
      "created": "2025-11-13T14:30:00Z",
      "size": 2048
    },
    {
      "version": 2,
      "file": "tic-tac-toe-application.spec.20251113.v2.md",
      "created": "2025-11-13T15:45:00Z",
      "size": 2560
    }
  ],
  "latest": "tic-tac-toe-application.spec.20251113.v2.md",
  "approved": null,
  "githubIssueUrl": null
}
```

**Fields**:
- `id`: Base name (slug) of the spec
- `title`: Human-readable title
- `project`: Project name
- `created`: First version creation timestamp
- `updated`: Last version update timestamp
- `versions`: Array of all versions
- `latest`: Filename of latest version
- `approved`: Filename of approved version (if any)
- `githubIssueUrl`: GitHub issue URL (if created)

## Workflow

### 1. Creating First Spec

**User Flow**:
```
User: "I want to build a tic tac toe game"
Sentra: [natural conversation about requirements]
User: "That sounds good, let's create the spec"
Sentra: [generates spec, saves it]
→ Creates: tic-tac-toe/tic-tac-toe-application.spec.20251113.md
```

**Backend Process**:
1. Extract title from spec content (first `# Heading`)
2. Generate base name slug
3. Create project directory if not exists
4. Create metadata directory
5. Save spec with date-based filename
6. Create metadata JSON
7. Return spec info to frontend

### 2. Iterating on Existing Spec

**User Flow**:
```
User: "Let's continue working on the tic tac toe spec"
Sentra: [loads latest version, shows context]
User: "Add multiplayer support"
Sentra: [generates updated spec]
→ Creates: tic-tac-toe/tic-tac-toe-application.spec.20251113.v2.md
```

**Detection Logic**:
1. User message contains keywords: "continue", "update", "modify", "edit", "change"
2. User explicitly mentions spec name
3. OR user selects spec from UI

**Backend Process**:
1. Detect same base name as existing spec
2. Check if same date as latest version
3. If same date: increment version (v2, v3, ...)
4. If different date: create new date-based file
5. Update metadata with new version
6. Return updated spec info

### 3. Creating New Feature Spec (Same Project)

**User Flow**:
```
User: "Let's create a spec for the AI opponent"
Sentra: [generates spec for new feature]
→ Creates: tic-tac-toe/tic-tac-toe-ai-opponent.spec.20251113.md
```

**Detection Logic**:
- Different title/topic than existing specs
- Generates different base name slug

**Backend Process**:
1. Extract new title from spec
2. Generate new base name slug
3. Create new spec file in same project directory
4. Create separate metadata JSON
5. Return new spec info

### 4. Approving a Spec

**User Flow**:
```
User: [Views spec in SpecViewer]
User: [Clicks "Approve & Create GitHub Issue"]
→ Marks specific version as approved
→ Creates GitHub issue
→ Updates metadata with approval info
```

**Backend Process**:
1. Update metadata: set `approved` field to specific version
2. Update metadata: set `githubIssueUrl` field
3. Keep all versions (no deletion)
4. Return success

## Backend Implementation (Rust)

### New Data Structures

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecMetadata {
    pub id: String,
    pub title: String,
    pub project: String,
    pub created: String,
    pub updated: String,
    pub versions: Vec<SpecVersion>,
    pub latest: String,
    pub approved: Option<String>,
    pub github_issue_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecVersion {
    pub version: u32,
    pub file: String,
    pub created: String,
    pub size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecInfo {
    pub id: String,
    pub title: String,
    pub project: String,
    pub file_path: String,
    pub version: u32,
    pub created: String,
    pub is_latest: bool,
    pub is_approved: bool,
    pub github_issue_url: Option<String>,
}
```

### New Commands

#### 1. `save_spec`

```rust
#[tauri::command]
pub fn save_spec(
    project_name: String,
    project_path: String,
    spec_content: String,
    spec_title: Option<String>, // Optional: extracted from content if not provided
) -> Result<SpecInfo, String>
```

**Logic**:
1. Extract title from content if not provided
2. Generate base name slug
3. Check for existing metadata
4. Determine version (new date or increment)
5. Save spec file
6. Update/create metadata
7. Return SpecInfo

#### 2. `list_specs`

```rust
#[tauri::command]
pub fn list_specs(
    project_name: String,
    project_path: String,
) -> Result<Vec<SpecInfo>, String>
```

**Returns**: Array of all specs (showing latest version of each)

#### 3. `get_spec`

```rust
#[tauri::command]
pub fn get_spec(
    project_name: String,
    project_path: String,
    spec_id: String, // Base name
    version: Option<String>, // Optional: specific version file
) -> Result<(String, SpecInfo), String>
```

**Returns**: Tuple of (content, metadata)

#### 4. `get_spec_versions`

```rust
#[tauri::command]
pub fn get_spec_versions(
    project_name: String,
    project_path: String,
    spec_id: String,
) -> Result<Vec<SpecVersion>, String>
```

**Returns**: All versions for a specific spec

#### 5. `approve_spec_version`

```rust
#[tauri::command]
pub fn approve_spec_version(
    project_name: String,
    project_path: String,
    spec_id: String,
    version_file: String,
    github_issue_url: Option<String>,
) -> Result<(), String>
```

**Logic**:
1. Load metadata
2. Set `approved` field to version_file
3. Set `githubIssueUrl` if provided
4. Save metadata
5. Keep all files (no archiving)

#### 6. `delete_spec`

```rust
#[tauri::command]
pub fn delete_spec(
    project_name: String,
    project_path: String,
    spec_id: String,
    version_file: Option<String>, // Optional: delete specific version or entire spec
) -> Result<(), String>
```

**Logic**:
- If version_file provided: delete specific version
- If not provided: delete all versions and metadata

### Helper Functions

```rust
fn extract_title_from_markdown(content: &str) -> Option<String>
fn generate_base_name(title: &str) -> String
fn sanitize_slug(text: &str) -> String
fn get_next_version_filename(
    base_name: &str,
    existing_files: Vec<String>,
) -> String
fn load_metadata(metadata_path: &Path) -> Result<SpecMetadata, String>
fn save_metadata(metadata_path: &Path, metadata: &SpecMetadata) -> Result<(), String>
```

## Frontend Integration

### ArchitectChat.tsx Updates

**Before saving spec**:
```typescript
const handleConversationHandoff = async () => {
  const conversationText = conversationTextRef.current.trim();
  const settings = await getSettings();

  // Generate spec from conversation
  const spec = await chatWithArchitect(projectName, prompt, [], settings.anthropicApiKey);

  // Save spec (backend auto-extracts title and handles versioning)
  const specInfo = await saveSpec(projectName, projectPath, spec);

  console.log(`✅ Spec saved: ${specInfo.title} (v${specInfo.version})`);

  cleanupVoiceMode();
  onClose();
};
```

### SpecViewer.tsx Updates

**New features**:
1. Show spec title prominently
2. Show version badge (v1, v2, latest)
3. Version history dropdown
4. "Continue Editing" button
5. Approve specific version

**Example UI**:
```tsx
<div className="spec-header">
  <h2>{specInfo.title}</h2>
  <div className="badges">
    <span className="version-badge">v{specInfo.version}</span>
    {specInfo.isLatest && <span className="latest-badge">Latest</span>}
    {specInfo.isApproved && <span className="approved-badge">Approved</span>}
  </div>
</div>

<div className="version-history">
  <select onChange={(e) => loadVersion(e.target.value)}>
    {versions.map(v => (
      <option key={v.file} value={v.file}>
        Version {v.version} - {formatDate(v.created)}
      </option>
    ))}
  </select>
</div>

<div className="actions">
  <button onClick={handleContinueEditing}>Continue Editing</button>
  <button onClick={() => approveVersion(currentVersion)}>
    Approve This Version & Create Issue
  </button>
</div>
```

### Dashboard (page.tsx) Updates

**Show all specs for project**:
```tsx
{project.specs && project.specs.length > 0 && (
  <div className="specs-list">
    {project.specs.map(spec => (
      <button
        key={spec.id}
        onClick={() => handleViewSpec(spec)}
        className="spec-badge"
      >
        {spec.title}
        <span className="version-count">{spec.versionCount}</span>
        {spec.isApproved && <CheckIcon />}
      </button>
    ))}
  </div>
)}
```

## Edge Cases & Handling

### 1. Same Spec Name, Same Day
**Solution**: Auto-increment version (v2, v3, ...)

### 2. Spec with No Title
**Solution**: Use "untitled-spec" as base name

### 3. Project Name with Spaces
**Solution**: Convert to kebab-case (`My Project` → `my-project`)

### 4. Special Characters in Titles
**Solution**: Sanitize to alphanumeric + hyphens only

### 5. Migrating Existing pending-spec.md
**Solution**: Migration function that:
1. Reads pending-spec.md
2. Extracts title
3. Moves to new versioned structure
4. Creates metadata
5. Deletes old pending-spec.md

### 6. Concurrent Edits (Rare)
**Solution**: Use filesystem atomic operations (write to temp, rename)

### 7. Very Long Titles
**Solution**: Truncate to 50 characters, ensure uniqueness

## Answers to Important Questions

### 1. How is spec title determined?

**Answer**: Multi-step extraction with fallbacks:
1. **Primary**: Extract from first `# Heading` in markdown
2. **Secondary**: User provides explicitly via optional parameter
3. **Fallback**: Use "Untitled Spec" if neither available

**Example**:
```markdown
# User Authentication System

This spec describes...
```
→ Title: "User Authentication System"
→ Base name: `user-authentication-system`

### 2. How to detect "continue working on spec"?

**Answer**: Three detection methods:

**Method 1: Keyword Detection**
- Parse user message for: "continue", "update", "modify", "edit", "change", "improve"
- Combined with spec reference: "continue the tic tac toe spec"

**Method 2: UI-Driven**
- User clicks "Continue Editing" button in SpecViewer
- Frontend passes spec ID to conversation

**Method 3: Context-Aware**
- If conversation context contains spec reference
- Frontend tracks "active spec" in conversation state

**Implementation**:
```typescript
const detectSpecContinuation = (userMessage: string, activeSpecs: SpecInfo[]) => {
  const keywords = ['continue', 'update', 'modify', 'edit', 'change', 'improve'];
  const hasKeyword = keywords.some(k => userMessage.toLowerCase().includes(k));

  if (hasKeyword) {
    // Try to match spec name
    const matchedSpec = activeSpecs.find(spec =>
      userMessage.toLowerCase().includes(spec.title.toLowerCase())
    );
    return matchedSpec;
  }

  return null;
};
```

### 3. What happens on approval?

**Answer**: Approval is version-specific:

1. **Any version can be approved** (not just latest)
2. **Approval updates metadata**:
   - Sets `approved` field to specific version filename
   - Sets `githubIssueUrl` when issue is created
3. **All versions are retained** (no deletion)
4. **Approved version gets badge** in UI
5. **Can re-approve different version** (updates metadata)

**Use Case**:
- User creates v1, v2, v3
- Decides v2 was best
- Approves v2 → creates GitHub issue from v2
- v2 marked as approved, v3 still available

### 4. Metadata storage?

**Answer**: Separate JSON files in `.metadata/` subdirectory

**Rationale**:
- ✅ One metadata file per spec family (clean)
- ✅ Doesn't pollute spec markdown (pure content)
- ✅ Easy to query without parsing markdown
- ✅ Supports rich metadata (dates, sizes, URLs)
- ✅ Easy to version control

**Alternative Rejected: Markdown Frontmatter**
- ❌ Pollutes spec content
- ❌ Harder to parse programmatically
- ❌ Can't share metadata across versions easily

**Alternative Rejected: Single metadata.json**
- ❌ Becomes large with many specs
- ❌ Concurrent write conflicts
- ❌ Harder to manage per-spec metadata

## Migration Plan

### Phase 1: Create Migration Command

```rust
#[tauri::command]
pub fn migrate_pending_specs(project_path: String) -> Result<Vec<String>, String> {
    // 1. Find all pending-spec.md files
    // 2. For each:
    //    a. Read content
    //    b. Extract title
    //    c. Generate base name
    //    d. Create versioned file (with current date)
    //    e. Create metadata
    //    f. Delete old pending-spec.md
    // 3. Return list of migrated specs
}
```

### Phase 2: Auto-Migration on First Load

```rust
// In get_projects() command:
if old_pending_spec_exists && !new_specs_dir_exists {
    migrate_pending_specs(project_path)?;
}
```

### Phase 3: Manual Migration UI

- Add "Migrate Old Specs" button in dashboard
- Shows progress of migration
- Lists all migrated specs

## Testing Strategy

### Unit Tests

1. **Filename Generation**:
   - Test title extraction
   - Test slug generation
   - Test sanitization
   - Test truncation
   - Test special characters

2. **Version Detection**:
   - Test same-day increment
   - Test different-day new file
   - Test version parsing

3. **Metadata Management**:
   - Test create new metadata
   - Test update existing metadata
   - Test version array management

### Integration Tests

1. **Save First Spec**:
   - Verify file created with correct name
   - Verify metadata created
   - Verify content matches

2. **Save Iteration (Same Day)**:
   - Verify v2 created
   - Verify metadata updated
   - Verify latest pointer updated

3. **Save New Feature (Same Project)**:
   - Verify new file with different base name
   - Verify separate metadata
   - Verify no interference

4. **Approve Spec**:
   - Verify metadata updated
   - Verify all files retained
   - Verify GitHub URL stored

5. **List Specs**:
   - Verify returns all specs
   - Verify latest version info
   - Verify approval status

### E2E Tests

1. **Complete Workflow**:
   - Create spec via voice conversation
   - View spec in SpecViewer
   - Edit spec (creates v2)
   - Approve v2
   - Verify GitHub issue created

2. **Multi-Spec Project**:
   - Create multiple specs for same project
   - Verify independent versioning
   - Verify correct listing

## File Size Limits

- Max spec file size: 10 MB (configurable)
- Max title length: 200 characters
- Max base name length: 50 characters
- Max versions per spec: 100 (soft limit, warning shown)

## Performance Considerations

1. **Lazy Loading**: Only load metadata when needed
2. **Caching**: Cache metadata in memory during session
3. **Pagination**: For projects with many specs (>50)
4. **Indexing**: Consider SQLite index for large projects (future)

## Security Considerations

1. **Path Traversal**: Validate all paths, no `../` allowed
2. **Filename Injection**: Sanitize all filenames
3. **Content Validation**: Validate markdown content
4. **Size Limits**: Enforce file size limits
5. **Permissions**: Ensure correct file permissions (644)

## Future Enhancements

1. **Diff Viewer**: Show changes between versions
2. **Branching**: Create spec branches for experimentation
3. **Templates**: Spec templates for common patterns
4. **Collaboration**: Multi-user spec editing (cloud sync)
5. **AI Suggestions**: Auto-suggest improvements
6. **Export**: Export to PDF, DOCX, etc.
7. **Search**: Full-text search across all specs

---

**Status**: Design Complete ✅
**Last Updated**: 2025-11-13
**Next Steps**: Implement Rust backend commands
