# Quick Start: Figma → Quetrex Import

Get up and running in 5 minutes.

## Step 1: Install Dependencies

```bash
pip install requests pyyaml python-dotenv
```

## Step 2: Get Figma Token

1. Go to https://www.figma.com/settings
2. Scroll to "Personal access tokens"
3. Click "Generate new token"
4. Copy the token

## Step 3: Add to .env

```bash
# .env
FIGMA_ACCESS_TOKEN=your_token_here
```

## Step 4: Create Architect Session

```bash
mkdir -p .quetrex/architect-sessions/my-project
```

Create `.quetrex/architect-sessions/my-project/ui-screens.md`:

```markdown
## Screen: Dashboard

### On Load
- Fetch data from API
- Show loading state

### User Actions
- **Click button**: Opens modal

### E2E Tests
- **User loads dashboard**:
  1. Navigate to /dashboard
  2. Verify data displayed
```

## Step 5: Run Import

```bash
python3 .quetrex/scripts/figma-import.py \
  --figma-url https://figma.com/file/YOUR_FILE_ID/YourFile \
  --project my-project
```

## Step 6: Check Output

```bash
ls docs/specs/screens/
# dashboard.yml
```

## Done!

Your screen specs are ready for Meta-Orchestrator to consume.

---

## Troubleshooting

**"FIGMA_ACCESS_TOKEN not set"**
- Check `.env` file exists
- Verify token is correct

**"Architect UI screens spec not found"**
- Create `.quetrex/architect-sessions/PROJECT_NAME/ui-screens.md`
- See example in `.quetrex/architect-sessions/example-project/`

**"Invalid Figma URL format"**
- Must be: `https://figma.com/file/FILE_ID/Title`
- Check URL is complete

**"Authentication failed"**
- Token may be expired
- Generate new token at https://www.figma.com/settings

---

## Example Output

See `sample-output-dashboard.yml` for complete example.

Spec includes:
- Visual structure (from Figma)
- Behavioral specs (from Architect)
- E2E test scenarios
- Design tokens
- Component list

Ready for agents to implement!
