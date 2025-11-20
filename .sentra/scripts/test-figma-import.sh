#!/bin/bash
# Test script for figma-import.py
# Tests the parsing logic without requiring a real Figma file

set -e  # Exit on error

echo "🧪 Testing Figma Import Script"
echo "================================"
echo ""

# Change to project root
cd "$(dirname "$0")/../.."

# Test 1: Check dependencies
echo "Test 1: Checking dependencies..."
python3 -c "import requests, yaml" 2>/dev/null && echo "  ✅ Dependencies installed" || {
    echo "  ❌ Missing dependencies"
    echo "  Run: pip install requests pyyaml python-dotenv"
    exit 1
}

# Test 2: Check example architect session exists
echo "Test 2: Checking example architect session..."
if [ -f ".sentra/architect-sessions/example-project/ui-screens.md" ]; then
    echo "  ✅ Example session exists"
else
    echo "  ❌ Example session not found"
    exit 1
fi

# Test 3: Test help output
echo "Test 3: Testing help output..."
python3 .sentra/scripts/figma-import.py --help >/dev/null 2>&1 && echo "  ✅ Help works" || {
    echo "  ❌ Help failed"
    exit 1
}

# Test 4: Test missing token error
echo "Test 4: Testing missing token error..."
unset FIGMA_ACCESS_TOKEN
output=$(python3 .sentra/scripts/figma-import.py \
    --figma-url https://figma.com/file/test123/Test \
    --project example-project 2>&1 || true)

if echo "$output" | grep -q "FIGMA_ACCESS_TOKEN"; then
    echo "  ✅ Correctly detects missing token"
else
    echo "  ❌ Should detect missing token"
    exit 1
fi

# Test 5: Test invalid URL format
echo "Test 5: Testing invalid URL detection..."
export FIGMA_ACCESS_TOKEN="test-token"
output=$(python3 .sentra/scripts/figma-import.py \
    --figma-url https://invalid-url.com \
    --project example-project 2>&1 || true)

if echo "$output" | grep -q "Invalid Figma URL"; then
    echo "  ✅ Correctly detects invalid URL"
else
    echo "  ❌ Should detect invalid URL"
    echo "Output: $output"
    exit 1
fi

# Test 6: Test missing architect session
echo "Test 6: Testing missing architect session detection..."
output=$(python3 .sentra/scripts/figma-import.py \
    --figma-url https://figma.com/file/test123/Test \
    --project nonexistent-project 2>&1 || true)

if echo "$output" | grep -q "Architect UI screens spec not found"; then
    echo "  ✅ Correctly detects missing session"
else
    echo "  ❌ Should detect missing session"
    exit 1
fi

echo ""
echo "================================"
echo "✅ All tests passed!"
echo ""
echo "Note: These are unit tests without real Figma API calls."
echo "To test with real Figma:"
echo "  1. Set FIGMA_ACCESS_TOKEN in .env"
echo "  2. Use a real Figma URL"
echo "  3. Run: python3 .sentra/scripts/figma-import.py --figma-url <url> --project example-project"
