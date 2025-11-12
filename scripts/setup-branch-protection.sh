#!/bin/bash
set -e

# Setup branch protection for Re-prod repository
# This script configures branch protection rules for main and develop branches

OWNER="ShinyaYoshida-biomet"
REPO="Re-prod"

echo "Setting up branch protection rules for $OWNER/$REPO"

# Function to setup branch protection
setup_branch_protection() {
  local BRANCH=$1

  echo ""
  echo "Configuring branch protection for: $BRANCH"

  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/$OWNER/$REPO/branches/$BRANCH/protection" \
    -f "required_status_checks[strict]=true" \
    -f "required_status_checks[contexts][]=quick-checks" \
    -f "required_pull_request_reviews[dismiss_stale_reviews]=true" \
    -f "required_pull_request_reviews[require_code_owner_reviews]=false" \
    -f "required_pull_request_reviews[required_approving_review_count]=1" \
    -f "required_pull_request_reviews[require_last_push_approval]=false" \
    -f "required_conversation_resolution=true" \
    -f "enforce_admins=true" \
    -f "restrictions=null" \
    -f "required_linear_history=false" \
    -f "allow_force_pushes=false" \
    -f "allow_deletions=false" \
    -f "block_creations=false" \
    -f "required_signatures=false" \
    -f "lock_branch=false" \
    -f "allow_fork_syncing=false"

  echo "✓ Branch protection configured for $BRANCH"
}

# Setup protection for main branch
setup_branch_protection "main"

# Setup protection for develop branch
setup_branch_protection "develop"

echo ""
echo "✓ Branch protection setup complete!"
echo ""
echo "Protection rules:"
echo "  - Require pull request with 1 approval"
echo "  - Dismiss stale approvals on new commits"
echo "  - Require status checks to pass (quick-checks job)"
echo "  - Require branches to be up to date"
echo "  - Require conversation resolution"
echo "  - Enforce for administrators"
echo "  - No force pushes"
echo "  - No branch deletions"
