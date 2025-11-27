#!/bin/bash
# Monitor Test Execution
# Watches GitHub Actions workflow runs and reports status
# Usage: ./scripts/monitor-test.sh

set -e

echo "🔍 Monitoring Quetrex Test Execution"
echo "===================================="
echo ""
echo "📊 Current Status (refreshes every 30 seconds)"
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
    clear
    echo "🔍 Quetrex Test Execution Monitor"
    echo "===================================="
    echo "Time: $(date)"
    echo ""

    # Get overall summary
    echo "📊 Workflow Summary:"
    gh run list --workflow="ai-agent.yml" --limit 15 --json status,conclusion,displayTitle | \
        jq -r 'group_by(.displayTitle) | map({
            title: .[0].displayTitle,
            total: length,
            in_progress: map(select(.status == "in_progress")) | length,
            completed: map(select(.status == "completed")) | length,
            success: map(select(.conclusion == "success")) | length,
            failed: map(select(.conclusion == "failure")) | length
        }) | .[] | select(.title | startswith("[BM-")) |
        "  \(.title | .[0:55]) | Total: \(.total) | ▶️  \(.in_progress) | ✅ \(.success) | ❌ \(.failed)"'

    echo ""
    echo "🔗 Recent Activity:"
    gh run list --workflow="ai-agent.yml" --limit 5 --json status,conclusion,displayTitle,createdAt,updatedAt | \
        jq -r '.[] | select(.displayTitle | startswith("[BM-")) |
        "  \(if .status == "in_progress" then "▶️" elif .conclusion == "success" then "✅" elif .conclusion == "failure" then "❌" else "⏸️" end) \(.displayTitle | .[0:50]) | Updated: \(.updatedAt | split("T")[1] | split("Z")[0])"'

    echo ""
    echo "📈 Test Progress:"

    # Check for any PRs created
    PR_COUNT=$(gh pr list --label "bookmark-test" --json number | jq 'length')
    echo "  Pull Requests Created: $PR_COUNT"

    # Check issue status
    echo "  Issues:"
    for issue_num in 22 23 24; do
        ISSUE_STATE=$(gh issue view $issue_num --json state,title | jq -r '"\(.state) | \(.title | .[0:45])"')
        echo "    #$issue_num: $ISSUE_STATE"
    done

    echo ""
    echo "⏱️  Next refresh in 30 seconds... (Ctrl+C to stop)"

    sleep 30
done
