# Quick Start: Bookmark Manager Test

This guide walks through running a complete end-to-end test of the Sentra AI-Powered SaaS Factory using the bookmark manager specification.

**Goal:** Create a clean, isolated test project where AI agents build a complete bookmark manager application from scratch.

---

## Prerequisites

✅ Sentra CLI installed (`sentra --version` should work)
✅ GitHub CLI authenticated (`gh auth status`)
✅ Docker installed and running
✅ Environment variables: `ANTHROPIC_API_KEY` (for AI agents)

---

## Step 1: Create Test Project (2 minutes)

```bash
# Create isolated test project
sentra test bookmark-manager-test ~/test-projects/bookmark-manager

# What this does:
# ✅ Creates ~/test-projects/bookmark-manager/
# ✅ Runs: npx create-next-app@latest (Next.js 15 + TypeScript + Tailwind)
# ✅ Initializes git repository
# ✅ Copies all Sentra infrastructure (.claude/, .sentra/, .github/)
# ✅ Copies bookmark-manager-test specification
```

**Output:**
```
🧪 Creating Test Project
📦 Step 1: Creating project directory
✅ Created ~/test-projects/bookmark-manager
🎨 Step 2: Initializing Next.js project
✅ Next.js project initialized
🔧 Step 3: Initializing Git repository
✅ Git repository initialized
🚀 Step 4: Running sentra init
✅ Copied 11 specialized agents
✅ Copied 6-layer quality defense hooks
✅ Copied 7 progressive disclosure skills
✅ Created configuration
📋 Step 5: Copying specification
✅ Copied bookmark-manager-test specification
✨ Test Project Ready!
```

---

## Step 2: Create GitHub Repository (1 minute)

```bash
cd ~/test-projects/bookmark-manager

# Create private GitHub repository
gh repo create bookmark-manager --private --source=. --remote=origin --push
```

**Important:** The repository name can be anything you want. We're using `bookmark-manager` for clarity.

---

## Step 3: Build and Push Docker Container (5 minutes)

The GitHub Actions workflow needs a Docker container to run AI agents securely.

```bash
cd ~/test-projects/bookmark-manager

# Build container image
docker build -t ghcr.io/YOUR_GITHUB_USERNAME/bookmark-manager-agent:latest -f .claude/Dockerfile .

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Push image
docker push ghcr.io/YOUR_GITHUB_USERNAME/bookmark-manager-agent:latest
```

**Replace:**
- `YOUR_GITHUB_USERNAME` with your actual GitHub username
- Make sure the image is set to public or GitHub Actions can access it

**Update workflow to use your image:**
```bash
# Update .github/workflows/ai-agent.yml to use your container
sed -i '' "s/\${{ github.repository_owner }}/YOUR_GITHUB_USERNAME/g" .github/workflows/ai-agent.yml
sed -i '' 's/sentra-agent:latest/bookmark-manager-agent:latest/g' .github/workflows/ai-agent.yml

# Commit and push
git add .github/workflows/ai-agent.yml
git commit -m "Update workflow to use project-specific container"
git push origin main
```

---

## Step 4: Create GitHub Labels (1 minute)

```bash
cd ~/test-projects/bookmark-manager

# Create required labels
gh label create "ai-feature" --description "AI agent will implement this" --color "0e8a16" || true
gh label create "p0" --description "Critical priority" --color "d73a4a" || true
gh label create "p1" --description "High priority" --color "ff9800" || true
gh label create "p2" --description "Medium priority" --color "ffc107" || true
gh label create "foundation" --description "Foundation infrastructure" --color "1d76db" || true
gh label create "needs-help" --description "Requires human attention" --color "d73a4a" || true
gh label create "bookmark-test" --description "Bookmark manager test project" --color "0e8a16" || true
```

---

## Step 5: Generate Issues (2 minutes)

The bookmark manager specification is already copied. Now generate the dependency graph and issues.

```bash
cd ~/test-projects/bookmark-manager

# Check that specification exists
ls -la .sentra/architect-sessions/bookmark-manager-test/

# Generate dependency graph (48 issues)
# Note: This should already exist, copied from Sentra repo
ls -la ~/Projects/sentra/.sentra/dependency-graph-bookmark-test.yml

# Copy dependency graph to test project
cp ~/Projects/sentra/.sentra/dependency-graph-bookmark-test.yml .sentra/dependency-graph.yml

# Copy issue templates
cp -r ~/Projects/sentra/.sentra/issues-bookmark-test .sentra/issues
```

---

## Step 6: Create GitHub Issues (Option A: Small Test)

**Option A: Test with 3 foundation issues first**

```bash
cd ~/test-projects/bookmark-manager

# Create Issue #1: Setup Next.js 15 + TypeScript
gh issue create --title "[BM-001] Setup Next.js 15 + TypeScript project structure" \
  --body-file .sentra/issues/issue-001.md \
  --label "ai-feature,p0,bookmark-test,foundation"

# Create Issue #2: Setup Prisma ORM
gh issue create --title "[BM-002] Setup Prisma ORM with PostgreSQL and SQLite" \
  --body-file .sentra/issues/issue-002.md \
  --label "ai-feature,p0,bookmark-test,foundation"

# Create Issue #3: Setup Vitest + Playwright
gh issue create --title "[BM-003] Setup Vitest + Playwright testing infrastructure" \
  --body-file .sentra/issues/issue-003.md \
  --label "ai-feature,p0,bookmark-test,foundation"
```

**Option B: Create all 48 issues**

```bash
# Create script to generate all issues
cat > create-all-issues.sh << 'EOF'
#!/bin/bash
set -e

for i in {1..48}; do
  issue_file=".sentra/issues/issue-$(printf "%03d" $i).md"

  if [ -f "$issue_file" ]; then
    # Extract title from markdown front matter
    title=$(grep "^title:" "$issue_file" | sed 's/title: "\(.*\)"/\1/')

    # Extract labels
    labels=$(grep "^labels:" "$issue_file" | sed 's/labels: \[\(.*\)\]/\1/' | tr -d '"' | tr ' ' ',')

    echo "Creating issue $i: $title"
    gh issue create --title "$title" --body-file "$issue_file" --label "$labels"

    # Rate limit: Wait 2 seconds between issues
    sleep 2
  fi
done
EOF

chmod +x create-all-issues.sh
./create-all-issues.sh
```

---

## Step 7: Monitor Execution

```bash
cd ~/test-projects/bookmark-manager

# Watch GitHub Actions workflows
gh run list --workflow="ai-agent.yml" --limit 10

# Watch specific run
gh run watch

# Or use monitoring script
./scripts/monitor-test.sh
```

---

## Step 8: Review Results

### Check Workflow Runs

```bash
# See status of all runs
gh run list --workflow="ai-agent.yml" --limit 20

# View logs for specific run
gh run view RUN_ID --log
```

### Check Pull Requests

```bash
# List PRs created by AI agents
gh pr list --label "bookmark-test"

# View specific PR
gh pr view PR_NUMBER

# Review diff
gh pr diff PR_NUMBER
```

### Check Issues

```bash
# List all issues
gh issue list --label "bookmark-test"

# View specific issue with comments
gh issue view ISSUE_NUMBER --comments
```

---

## Expected Results

### Batch 1: Foundation (Issues #1-10)

**Issues:**
1. Setup Next.js 15 + TypeScript ✅
2. Setup Prisma ORM ✅
3. Setup Vitest + Playwright ✅
4. Define database schema ✅
5. Seed database ✅
6. Setup CI/CD pipeline ✅
7. Implement dark theme ✅
8. Configure environment variables ✅
9. Setup error handling ✅
10. Security configuration ✅

**Expected Time:** 15-30 minutes per issue
**Expected PRs:** 10 pull requests ready for review

### Batch 2: Core APIs (Issues #11-25)

**Issues:** Authentication, bookmark CRUD, tags, search

**Expected Time:** 20-40 minutes per issue
**Expected PRs:** 15 pull requests

### Batch 3: UI Components (Issues #26-40)

**Issues:** Dashboard, forms, modals, lists

**Expected Time:** 25-45 minutes per issue
**Expected PRs:** 15 pull requests

### Batch 4: Polish (Issues #41-48)

**Issues:** Performance, accessibility, documentation

**Expected Time:** 15-30 minutes per issue
**Expected PRs:** 8 pull requests

---

## Troubleshooting

### Issue: Workflow runs fail immediately

**Cause:** Container image not available or wrong name in workflow

**Fix:**
```bash
# Check container image exists
docker pull ghcr.io/YOUR_USERNAME/bookmark-manager-agent:latest

# Verify workflow uses correct image
grep "image:" .github/workflows/ai-agent.yml
```

### Issue: Multiple workflow runs per issue

**Cause:** Each label triggers a separate `labeled` event

**Fix:** Add concurrency group to `.github/workflows/ai-agent.yml`:
```yaml
jobs:
  ai-agent-work:
    concurrency:
      group: issue-${{ github.event.issue.number }}
      cancel-in-progress: false
```

### Issue: Agents can't push branches

**Cause:** Git credentials not configured in container

**Fix:** Verify `GITHUB_TOKEN` is available in workflow environment and git is configured

### Issue: Build fails with TypeScript errors

**Cause:** Agent modified existing code instead of creating new files

**Check:** This shouldn't happen in a clean test project. If it does, the specification or issue templates may reference wrong files.

---

## Success Metrics

After all 48 issues complete, you should have:

### Code Quality
- ✅ 48 PRs created (one per issue)
- ✅ All tests passing
- ✅ Coverage ≥ 75% overall, ≥ 90% services/utils
- ✅ TypeScript strict mode, no errors
- ✅ Build successful

### Functionality
- ✅ User authentication (register, login, JWT)
- ✅ Bookmark CRUD (create, read, update, delete)
- ✅ Tags and search
- ✅ Dark theme
- ✅ Responsive design

### Documentation
- ✅ README with setup instructions
- ✅ API documentation
- ✅ E2E test scenarios

### Autonomous Completion
- **Target:** 65-70% issues complete without human intervention
- **Realistic:** 50-60% on first run (foundation issues should succeed, complex UI may need help)

---

## Next Steps After Test

### 1. Review Code Quality

```bash
cd ~/test-projects/bookmark-manager

# Checkout a PR branch
gh pr checkout PR_NUMBER

# Review code
code .

# Run tests
npm test
npm run test:e2e

# Check coverage
npm run test:coverage
```

### 2. Merge Successful PRs

```bash
# Merge a PR
gh pr merge PR_NUMBER --squash --delete-branch
```

### 3. Analyze Results

Document:
- How many issues completed autonomously?
- How many needed human help?
- What types of issues failed? (Complex UI? Database migrations? API integration?)
- Average time per issue?
- Total cost (GitHub Actions minutes + API calls)?

### 4. Improve System

Based on results:
- Update issue templates for clarity
- Improve agent prompts
- Add more examples to specifications
- Enhance quality gates

---

## Clean Up

```bash
# Delete test project
rm -rf ~/test-projects/bookmark-manager

# Delete GitHub repository
gh repo delete YOUR_USERNAME/bookmark-manager --yes

# Delete Docker image
docker rmi ghcr.io/YOUR_USERNAME/bookmark-manager-agent:latest
```

---

## Summary

**What we tested:**
1. ✅ Sentra CLI tool (`sentra test`)
2. ✅ Test project isolation
3. ✅ Specification → Issue generation
4. ✅ GitHub Actions workflow
5. ✅ Multi-agent AI execution
6. ✅ Quality gates (tests, coverage, TypeScript)
7. ✅ PR creation and review process

**Time Investment:**
- Setup: ~10 minutes
- Execution: 20-40 hours (AI agents working in parallel)
- Human time: ~2-3 hours (monitoring, reviewing PRs)

**Value:**
- Validates complete end-to-end workflow
- Tests 48 parallelizable issues
- Proves AI-powered development at scale
- Identifies bottlenecks and improvements

---

**Ready to run the test?**

```bash
sentra test bookmark-manager-test ~/test-projects/bookmark-manager
```
