#!/bin/bash

# Quetrex Version Bump Script
# Created by Glen Barnhardt with help from Claude Code
#
# This script manages versioning across all project files and creates release tags
# Usage: ./scripts/bump-version.sh [major|minor|patch|VERSION]
#
# Examples:
#   ./scripts/bump-version.sh patch     # 1.0.0 -> 1.0.1
#   ./scripts/bump-version.sh minor     # 1.0.0 -> 1.1.0
#   ./scripts/bump-version.sh major     # 1.0.0 -> 2.0.0
#   ./scripts/bump-version.sh 1.2.3     # Set to specific version

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error handling
error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    exit 1
}

info() {
    echo -e "${BLUE}INFO: $1${NC}"
}

success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

# Check if git is clean
check_git_status() {
    if ! git diff-index --quiet HEAD --; then
        error "Working directory is not clean. Commit or stash changes first."
    fi

    if ! git diff --cached --quiet; then
        error "Staged changes detected. Commit or unstage changes first."
    fi

    info "Git working directory is clean ✓"
}

# Parse current version from package.json
get_current_version() {
    if ! command -v jq &> /dev/null; then
        error "jq is required but not installed. Install with: brew install jq"
    fi

    CURRENT_VERSION=$(jq -r '.version' package.json)
    if [ -z "$CURRENT_VERSION" ] || [ "$CURRENT_VERSION" == "null" ]; then
        error "Could not read version from package.json"
    fi

    echo "$CURRENT_VERSION"
}

# Calculate new version based on bump type
calculate_new_version() {
    local current="$1"
    local bump_type="$2"

    IFS='.' read -r major minor patch <<< "$current"

    case "$bump_type" in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            # Assume it's a specific version
            if [[ ! "$bump_type" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                error "Invalid version format. Use: major|minor|patch|X.Y.Z"
            fi
            echo "$bump_type"
            return
            ;;
    esac

    echo "$major.$minor.$patch"
}

# Update version in package.json
update_package_json() {
    local new_version="$1"

    info "Updating package.json..."

    # Use jq to update version
    jq ".version = \"$new_version\"" package.json > package.json.tmp
    mv package.json.tmp package.json

    success "Updated package.json to v$new_version"
}

# Update version in Cargo.toml
update_cargo_toml() {
    local new_version="$1"
    local cargo_file="src-tauri/Cargo.toml"

    info "Updating Cargo.toml..."

    if [ ! -f "$cargo_file" ]; then
        warning "Cargo.toml not found at $cargo_file"
        return
    fi

    # Update version in Cargo.toml
    if command -v gsed &> /dev/null; then
        gsed -i "s/^version = \".*\"/version = \"$new_version\"/" "$cargo_file"
    else
        sed -i.bak "s/^version = \".*\"/version = \"$new_version\"/" "$cargo_file"
        rm -f "${cargo_file}.bak"
    fi

    success "Updated Cargo.toml to v$new_version"
}

# Update version in tauri.conf.json
update_tauri_conf() {
    local new_version="$1"
    local tauri_conf="src-tauri/tauri.conf.json"

    info "Updating tauri.conf.json..."

    if [ ! -f "$tauri_conf" ]; then
        warning "tauri.conf.json not found at $tauri_conf"
        return
    fi

    jq ".version = \"$new_version\"" "$tauri_conf" > "${tauri_conf}.tmp"
    mv "${tauri_conf}.tmp" "$tauri_conf"

    success "Updated tauri.conf.json to v$new_version"
}

# Update or create CHANGELOG.md
update_changelog() {
    local new_version="$1"
    local date=$(date +%Y-%m-%d)

    info "Updating CHANGELOG.md..."

    if [ ! -f "CHANGELOG.md" ]; then
        info "Creating CHANGELOG.md..."
        cat > CHANGELOG.md <<EOF
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [$new_version] - $date

### Added
- Initial release

EOF
        success "Created CHANGELOG.md"
        return
    fi

    # Check if version already exists
    if grep -q "\[$new_version\]" CHANGELOG.md; then
        warning "Version $new_version already exists in CHANGELOG.md"
        return
    fi

    # Extract unreleased section
    UNRELEASED=$(awk '/## \[Unreleased\]/,/## \[/' CHANGELOG.md | sed '1d;$d')

    if [ -z "$UNRELEASED" ]; then
        warning "No unreleased changes found in CHANGELOG.md"
        UNRELEASED="### Changed\n- Version bump to v$new_version\n"
    fi

    # Create new changelog with version section
    awk -v version="$new_version" -v date="$date" -v changes="$UNRELEASED" '
        /## \[Unreleased\]/ {
            print $0
            print ""
            print "## [" version "] - " date
            print ""
            print changes
            next
        }
        { print }
    ' CHANGELOG.md > CHANGELOG.md.tmp

    mv CHANGELOG.md.tmp CHANGELOG.md

    success "Updated CHANGELOG.md with v$new_version"
}

# Run npm install to update package-lock.json
update_lockfile() {
    info "Updating package-lock.json..."

    npm install --package-lock-only

    success "Updated package-lock.json"
}

# Create git commit and tag
create_git_tag() {
    local new_version="$1"
    local tag="v$new_version"

    info "Creating git commit and tag..."

    # Stage all changes
    git add package.json package-lock.json CHANGELOG.md
    git add src-tauri/Cargo.toml src-tauri/tauri.conf.json || true

    # Create commit
    git commit -m "chore(release): bump version to v$new_version (branch created by Glen Barnhardt with help from Claude Code)

Release v$new_version

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

    # Create annotated tag
    git tag -a "$tag" -m "Release v$new_version

🤖 Generated with Claude Code"

    success "Created commit and tag $tag"
}

# Show summary
show_summary() {
    local current_version="$1"
    local new_version="$2"
    local tag="v$new_version"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    success "Version bump complete!"
    echo ""
    echo "  Old version: $current_version"
    echo "  New version: $new_version"
    echo "  Git tag:     $tag"
    echo ""
    echo "Next steps:"
    echo ""
    echo "  1. Review the changes:"
    echo "     ${BLUE}git show HEAD${NC}"
    echo ""
    echo "  2. Push to remote:"
    echo "     ${BLUE}git push origin main${NC}"
    echo ""
    echo "  3. Push the tag to trigger release workflow:"
    echo "     ${BLUE}git push origin $tag${NC}"
    echo ""
    echo "  4. Monitor the release workflow:"
    echo "     ${BLUE}https://github.com/barnent1/quetrex/actions${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Main script
main() {
    echo ""
    info "Quetrex Version Bump Script"
    echo ""

    # Check arguments
    if [ $# -ne 1 ]; then
        error "Usage: $0 [major|minor|patch|VERSION]"
    fi

    BUMP_TYPE="$1"

    # Verify we're in project root
    if [ ! -f "package.json" ]; then
        error "package.json not found. Run this script from project root."
    fi

    # Check git status
    check_git_status

    # Get current version
    CURRENT_VERSION=$(get_current_version)
    info "Current version: $CURRENT_VERSION"

    # Calculate new version
    NEW_VERSION=$(calculate_new_version "$CURRENT_VERSION" "$BUMP_TYPE")
    info "New version: $NEW_VERSION"

    # Confirm with user
    echo ""
    read -p "Bump version from $CURRENT_VERSION to $NEW_VERSION? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        warning "Version bump cancelled"
        exit 0
    fi

    # Update all files
    update_package_json "$NEW_VERSION"
    update_cargo_toml "$NEW_VERSION"
    update_tauri_conf "$NEW_VERSION"
    update_changelog "$NEW_VERSION"
    update_lockfile

    # Create git commit and tag
    create_git_tag "$NEW_VERSION"

    # Show summary
    show_summary "$CURRENT_VERSION" "$NEW_VERSION"
}

# Run main function
main "$@"
