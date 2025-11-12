#!/usr/bin/env bash
# notify.sh - Comprehensive notification system for AI agent progress
# Sends notifications via GitHub comments, Slack, Discord, and more
# Created by Glen Barnhardt with the help of Claude Code

set -euo pipefail

# ============================================================================
# Configuration and Environment
# ============================================================================

# Load environment variables
if [ -f ~/.claude-env ]; then
    source ~/.claude-env
fi

# Default settings
GITHUB_COMMENTS_ENABLED="${CLAUDE_GITHUB_COMMENTS:-true}"
LOG_DIR="${CLAUDE_LOG_DIR:-$HOME/.claude/logs}"
VERBOSE="${CLAUDE_VERBOSE:-false}"

# ============================================================================
# Utility Functions
# ============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    if [ "$VERBOSE" = "true" ] || [ "$level" = "ERROR" ]; then
        echo "[$timestamp] [$level] $message" >&2
    fi

    # Log to file
    mkdir -p "$LOG_DIR"
    echo "[$timestamp] [$level] $message" >> "$LOG_DIR/notifications.log"
}

error() {
    log "ERROR" "$@"
    return 1
}

# ============================================================================
# Argument Parsing and Validation
# ============================================================================

usage() {
    cat <<EOF
Usage: $0 <type> <issue_number> <message> [details_json]

Arguments:
  type           Notification type: start|progress|success|failure|warning
  issue_number   GitHub issue number
  message        The notification message
  details_json   Optional JSON string with additional details

Environment Variables:
  GITHUB_TOKEN              GitHub token for posting comments (required for GitHub)
  SLACK_WEBHOOK_URL         Optional Slack webhook URL
  DISCORD_WEBHOOK_URL       Optional Discord webhook URL
  CLAUDE_GITHUB_COMMENTS    Whether to post GitHub comments (default: true)
  GITHUB_REPOSITORY         Repository in format "owner/repo"
  GITHUB_RUN_ID             GitHub Actions run ID (optional)
  GITHUB_SERVER_URL         GitHub server URL (default: https://github.com)

Examples:
  $0 start 42 "Agent started working on issue #42" '{"branch":"feature/issue-42"}'
  $0 progress 42 "Implemented SpecViewer component" '{"files_changed":3}'
  $0 success 42 "PR #123 created successfully" '{"pr_url":"https://..."}'
  $0 failure 42 "Build failed" '{"error":"TypeScript compilation error"}'
  $0 warning 42 "Tests passed but with warnings" '{"warnings":5}'

EOF
    exit 1
}

# Validate arguments
if [ $# -lt 3 ]; then
    usage
fi

TYPE="$1"
ISSUE_NUMBER="$2"
MESSAGE="$3"
if [ $# -ge 4 ]; then
    DETAILS="$4"
else
    DETAILS="{}"
fi

# Validate type
case "$TYPE" in
    start|progress|success|failure|warning)
        ;;
    *)
        error "Invalid notification type: $TYPE. Must be one of: start, progress, success, failure, warning"
        ;;
esac

# Validate issue number
if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
    error "Invalid issue number: $ISSUE_NUMBER. Must be a positive integer."
fi

# Validate details is valid JSON
if ! echo "$DETAILS" | jq empty 2>/dev/null; then
    error "Invalid JSON in details parameter: $DETAILS"
fi

log "INFO" "Processing $TYPE notification for issue #$ISSUE_NUMBER"

# ============================================================================
# Formatting Configuration
# ============================================================================

get_emoji() {
    case "$1" in
        start)    echo "🚀" ;;
        progress) echo "⚙️" ;;
        success)  echo "✅" ;;
        failure)  echo "❌" ;;
        warning)  echo "⚠️" ;;
        *)        echo "ℹ️" ;;
    esac
}

get_color() {
    local format="$1"
    local type="$2"

    case "$format" in
        slack)
            case "$type" in
                start)    echo "#0066FF" ;;
                progress) echo "#808080" ;;
                success)  echo "good" ;;
                failure)  echo "danger" ;;
                warning)  echo "warning" ;;
            esac
            ;;
        discord)
            case "$type" in
                start)    echo "3447003" ;;   # Blue
                progress) echo "8421504" ;;   # Gray
                success)  echo "3066993" ;;   # Green
                failure)  echo "15158332" ;;  # Red
                warning)  echo "16776960" ;;  # Yellow
            esac
            ;;
    esac
}

# ============================================================================
# GitHub Comment Functions
# ============================================================================

post_github_comment() {
    local issue_num="$1"
    local body="$2"

    # Check if GitHub integration is enabled
    if [ "$GITHUB_COMMENTS_ENABLED" != "true" ]; then
        log "INFO" "GitHub comments disabled, skipping"
        return 0
    fi

    # Validate required environment
    if [ -z "${GITHUB_TOKEN:-}" ]; then
        log "WARN" "GITHUB_TOKEN not set, skipping GitHub comment"
        return 0
    fi

    if [ -z "${GITHUB_REPOSITORY:-}" ]; then
        log "WARN" "GITHUB_REPOSITORY not set, skipping GitHub comment"
        return 0
    fi

    # Check if gh CLI is available
    if ! command -v gh &> /dev/null; then
        log "WARN" "gh CLI not found, skipping GitHub comment"
        return 0
    fi

    log "INFO" "Posting comment to GitHub issue #$issue_num"

    # Post comment using gh CLI
    if echo "$body" | gh issue comment "$issue_num" --repo "$GITHUB_REPOSITORY" --body-file - 2>/dev/null; then
        log "INFO" "Successfully posted GitHub comment"
    else
        log "ERROR" "Failed to post GitHub comment"
        return 1
    fi
}

format_github_comment() {
    local type="$1"
    local message="$2"
    local details="$3"
    local emoji=$(get_emoji "$type")
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S %Z')

    # Build comment body
    local comment="## $emoji $(echo "$type" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')

**Message:** $message

**Timestamp:** $timestamp"

    # Add workflow run link if available
    if [ -n "${GITHUB_RUN_ID:-}" ] && [ -n "${GITHUB_REPOSITORY:-}" ]; then
        local server_url="${GITHUB_SERVER_URL:-https://github.com}"
        local run_url="$server_url/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
        comment="$comment

**Workflow Run:** $run_url"
    fi

    # Parse and add details if provided
    if [ "$details" != "{}" ]; then
        comment="$comment

### Details"

        # Extract common fields
        local branch=$(echo "$details" | jq -r '.branch // empty' 2>/dev/null)
        local pr_url=$(echo "$details" | jq -r '.pr_url // empty' 2>/dev/null)
        local pr_number=$(echo "$details" | jq -r '.pr_number // empty' 2>/dev/null)
        local files_changed=$(echo "$details" | jq -r '.files_changed // empty' 2>/dev/null)
        local error=$(echo "$details" | jq -r '.error // empty' 2>/dev/null)
        local warnings=$(echo "$details" | jq -r '.warnings // empty' 2>/dev/null)

        [ -n "$branch" ] && comment="$comment
- **Branch:** \`$branch\`"

        if [ -n "$pr_url" ]; then
            comment="$comment
- **Pull Request:** $pr_url"
        elif [ -n "$pr_number" ]; then
            comment="$comment
- **Pull Request:** #$pr_number"
        fi

        [ -n "$files_changed" ] && comment="$comment
- **Files Changed:** $files_changed"

        [ -n "$warnings" ] && comment="$comment
- **Warnings:** $warnings"

        if [ -n "$error" ]; then
            comment="$comment

\`\`\`
$error
\`\`\`"
        fi

        # Add any remaining fields
        local other_fields=$(echo "$details" | jq -r 'to_entries | map(select(.key | IN("branch", "pr_url", "pr_number", "files_changed", "error", "warnings") | not)) | map("- **\(.key | gsub("_"; " ") | gsub("\\b(.)(\\w*)"; "\\u\\1\\L\\2")):** \(.value)") | .[]' 2>/dev/null)
        if [ -n "$other_fields" ]; then
            comment="$comment
$other_fields"
        fi
    fi

    # Add footer
    comment="$comment

---
*Generated by AI Agent @ $timestamp*"

    echo "$comment"
}

# ============================================================================
# Slack Functions
# ============================================================================

post_slack_notification() {
    local type="$1"
    local message="$2"
    local issue_num="$3"
    local details="$4"

    if [ -z "${SLACK_WEBHOOK_URL:-}" ]; then
        log "INFO" "SLACK_WEBHOOK_URL not set, skipping Slack notification"
        return 0
    fi

    log "INFO" "Posting notification to Slack"

    local emoji=$(get_emoji "$type")
    local color=$(get_color "slack" "$type")
    local timestamp=$(date +%s)

    # Build issue URL
    local issue_url=""
    if [ -n "${GITHUB_REPOSITORY:-}" ]; then
        local server_url="${GITHUB_SERVER_URL:-https://github.com}"
        issue_url="$server_url/$GITHUB_REPOSITORY/issues/$issue_num"
    fi

    # Build attachment fields
    local fields='[]'

    if [ -n "$issue_url" ]; then
        fields=$(echo "$fields" | jq --arg url "$issue_url" '. += [{"title": "Issue", "value": $url, "short": true}]')
    fi

    if [ -n "${GITHUB_RUN_ID:-}" ] && [ -n "${GITHUB_REPOSITORY:-}" ]; then
        local server_url="${GITHUB_SERVER_URL:-https://github.com}"
        local run_url="$server_url/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
        fields=$(echo "$fields" | jq --arg url "$run_url" '. += [{"title": "Workflow Run", "value": $url, "short": true}]')
    fi

    # Add details fields
    if [ "$details" != "{}" ]; then
        local branch=$(echo "$details" | jq -r '.branch // empty' 2>/dev/null)
        local pr_url=$(echo "$details" | jq -r '.pr_url // empty' 2>/dev/null)
        local files_changed=$(echo "$details" | jq -r '.files_changed // empty' 2>/dev/null)
        local error=$(echo "$details" | jq -r '.error // empty' 2>/dev/null)

        [ -n "$branch" ] && fields=$(echo "$fields" | jq --arg val "$branch" '. += [{"title": "Branch", "value": $val, "short": true}]')
        [ -n "$pr_url" ] && fields=$(echo "$fields" | jq --arg val "$pr_url" '. += [{"title": "Pull Request", "value": $val, "short": true}]')
        [ -n "$files_changed" ] && fields=$(echo "$fields" | jq --arg val "$files_changed" '. += [{"title": "Files Changed", "value": $val, "short": true}]')
        [ -n "$error" ] && fields=$(echo "$fields" | jq --arg val "$error" '. += [{"title": "Error", "value": $val, "short": false}]')
    fi

    # Build Slack payload
    local payload=$(jq -n \
        --arg text "$emoji Issue #$issue_num: $message" \
        --arg color "$color" \
        --arg title "$(echo "$type" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')" \
        --arg msg "$message" \
        --argjson ts "$timestamp" \
        --argjson fields "$fields" \
        '{
            text: $text,
            attachments: [{
                color: $color,
                title: $title,
                text: $msg,
                fields: $fields,
                ts: $ts,
                footer: "AI Agent",
                footer_icon: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
            }]
        }')

    if curl -s -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "$payload" > /dev/null 2>&1; then
        log "INFO" "Successfully posted Slack notification"
    else
        log "ERROR" "Failed to post Slack notification"
        return 1
    fi
}

# ============================================================================
# Discord Functions
# ============================================================================

post_discord_notification() {
    local type="$1"
    local message="$2"
    local issue_num="$3"
    local details="$4"

    if [ -z "${DISCORD_WEBHOOK_URL:-}" ]; then
        log "INFO" "DISCORD_WEBHOOK_URL not set, skipping Discord notification"
        return 0
    fi

    log "INFO" "Posting notification to Discord"

    local emoji=$(get_emoji "$type")
    local color=$(get_color "discord" "$type")
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

    # Build issue URL
    local issue_url=""
    if [ -n "${GITHUB_REPOSITORY:-}" ]; then
        local server_url="${GITHUB_SERVER_URL:-https://github.com}"
        issue_url="$server_url/$GITHUB_REPOSITORY/issues/$issue_num"
    fi

    # Build embed fields
    local fields='[]'

    if [ "$details" != "{}" ]; then
        local branch=$(echo "$details" | jq -r '.branch // empty' 2>/dev/null)
        local pr_url=$(echo "$details" | jq -r '.pr_url // empty' 2>/dev/null)
        local files_changed=$(echo "$details" | jq -r '.files_changed // empty' 2>/dev/null)

        [ -n "$branch" ] && fields=$(echo "$fields" | jq --arg val "$branch" '. += [{"name": "Branch", "value": $val, "inline": true}]')
        [ -n "$pr_url" ] && fields=$(echo "$fields" | jq --arg val "$pr_url" '. += [{"name": "Pull Request", "value": $val, "inline": true}]')
        [ -n "$files_changed" ] && fields=$(echo "$fields" | jq --arg val "$files_changed" '. += [{"name": "Files Changed", "value": $val, "inline": true}]')
    fi

    if [ -n "${GITHUB_RUN_ID:-}" ] && [ -n "${GITHUB_REPOSITORY:-}" ]; then
        local server_url="${GITHUB_SERVER_URL:-https://github.com}"
        local run_url="$server_url/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
        fields=$(echo "$fields" | jq --arg val "[$GITHUB_RUN_ID]($run_url)" '. += [{"name": "Workflow Run", "value": $val, "inline": true}]')
    fi

    # Build Discord embed
    local embed=$(jq -n \
        --arg title "$emoji $(echo "$type" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}') - Issue #$issue_num" \
        --arg desc "$message" \
        --argjson color "$color" \
        --arg ts "$timestamp" \
        --arg url "$issue_url" \
        --argjson fields "$fields" \
        '{
            title: $title,
            description: $desc,
            color: $color,
            timestamp: $ts,
            url: $url,
            fields: $fields,
            footer: {
                text: "AI Agent"
            }
        }')

    local payload=$(jq -n --argjson embed "$embed" '{embeds: [$embed]}')

    if curl -s -X POST "$DISCORD_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "$payload" > /dev/null 2>&1; then
        log "INFO" "Successfully posted Discord notification"
    else
        log "ERROR" "Failed to post Discord notification"
        return 1
    fi
}

# ============================================================================
# Desktop Notification (macOS)
# ============================================================================

post_desktop_notification() {
    local type="$1"
    local message="$2"
    local issue_num="$3"

    # Only on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        return 0
    fi

    if ! command -v osascript &> /dev/null; then
        return 0
    fi

    local emoji=$(get_emoji "$type")
    local title="$emoji Issue #$issue_num"
    local subtitle=$(echo "$type" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')

    osascript -e "display notification \"$message\" with title \"$title\" subtitle \"$subtitle\"" 2>/dev/null || true
    log "INFO" "Posted desktop notification"
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    local type="$1"
    local issue_num="$2"
    local message="$3"
    local details="$4"

    local success=true

    # Format and post GitHub comment
    if [ "$GITHUB_COMMENTS_ENABLED" = "true" ]; then
        local github_comment=$(format_github_comment "$type" "$message" "$details")
        if ! post_github_comment "$issue_num" "$github_comment"; then
            success=false
        fi
    fi

    # Post Slack notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        if ! post_slack_notification "$type" "$message" "$issue_num" "$details"; then
            success=false
        fi
    fi

    # Post Discord notification
    if [ -n "${DISCORD_WEBHOOK_URL:-}" ]; then
        if ! post_discord_notification "$type" "$message" "$issue_num" "$details"; then
            success=false
        fi
    fi

    # Post desktop notification
    post_desktop_notification "$type" "$message" "$issue_num"

    # Log notification
    local emoji=$(get_emoji "$type")
    log "INFO" "$emoji Issue #$issue_num: $message"

    if [ "$success" = "true" ]; then
        log "INFO" "All notifications sent successfully"
        return 0
    else
        log "WARN" "Some notifications failed to send"
        return 1
    fi
}

# ============================================================================
# Entry Point
# ============================================================================

# Run main function
main "$TYPE" "$ISSUE_NUMBER" "$MESSAGE" "$DETAILS"
exit $?
