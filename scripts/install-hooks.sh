#!/bin/bash
#
# Install Git hooks for Re-prod project
#
# This script copies pre-configured Git hooks to your local .git/hooks/ directory
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/hooks"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "🔧 Installing Git hooks for Re-prod..."
echo ""

# Check if we're in a git repository
if [ ! -d "$GIT_HOOKS_DIR" ]; then
    echo "❌ Error: .git/hooks directory not found"
    echo "   Make sure you're running this script from the Re-prod project root"
    exit 1
fi

# Install pre-push hook
if [ -f "$HOOKS_DIR/pre-push" ]; then
    echo "📝 Installing pre-push hook..."
    cp "$HOOKS_DIR/pre-push" "$GIT_HOOKS_DIR/pre-push"
    chmod +x "$GIT_HOOKS_DIR/pre-push"
    echo "   ✓ Pre-push hook installed"
else
    echo "⚠️  Warning: hooks/pre-push template not found"
fi

echo ""
echo "✅ Git hooks installation complete!"
echo ""
echo "The following checks will run before each push:"
echo "  • Rust formatting (cargo fmt --check)"
echo "  • Rust linting (cargo clippy)"
echo "  • TypeScript linting (pnpm run lint)"
echo ""
echo "To bypass these checks (not recommended), use:"
echo "  git push --no-verify"
echo ""
