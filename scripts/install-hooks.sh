#!/bin/bash
#
# Configure Git hooks for Re-prod project
#
# This script configures Git to use the hooks/ directory directly
# using core.hooksPath (Git 2.9+)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔧 Configuring Git hooks for Re-prod..."
echo ""

# Check if we're in a git repository
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "❌ Error: Not a Git repository"
    echo "   Make sure you're running this script from the Re-prod project root"
    exit 1
fi

# Check Git version (require 2.9+)
GIT_VERSION=$(git --version | awk '{print $3}')
GIT_MAJOR=$(echo "$GIT_VERSION" | cut -d. -f1)
GIT_MINOR=$(echo "$GIT_VERSION" | cut -d. -f2)

if [ "$GIT_MAJOR" -lt 2 ] || ([ "$GIT_MAJOR" -eq 2 ] && [ "$GIT_MINOR" -lt 9 ]); then
    echo "⚠️  Warning: Git 2.9+ required for core.hooksPath"
    echo "   Your version: $GIT_VERSION"
    echo "   Please upgrade Git or install hooks manually"
    exit 1
fi

# Configure Git to use hooks/ directory
cd "$PROJECT_ROOT"
git config core.hooksPath hooks

echo "✅ Git hooks configuration complete!"
echo ""
echo "   Git is now configured to use the hooks/ directory directly"
echo "   (using core.hooksPath)"
echo ""
echo "The following checks will run before each push:"
echo "  • Rust formatting (cargo fmt --check)"
echo "  • Rust linting (cargo clippy)"
echo "  • TypeScript linting (pnpm run lint)"
echo ""
echo "To bypass these checks (not recommended), use:"
echo "  git push --no-verify"
echo ""
