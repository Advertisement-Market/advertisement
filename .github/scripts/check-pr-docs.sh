#!/usr/bin/env bash
set -euo pipefail

echo "========================================================"
echo "    The AdBasket — PR Documentation Compliance Check    "
echo "========================================================"

EVENT_NAME="${GITHUB_EVENT_NAME:-local}"
BASE_REF="${GITHUB_BASE_REF:-master}"

if [ "$EVENT_NAME" != "pull_request" ] && [ "$EVENT_NAME" != "local" ]; then
  echo "ℹ️  Event '$EVENT_NAME' is not a pull request. Skipping PR documentation check."
  exit 0
fi

# Resolve target ref (handle origin/branch, branch, or commit hash)
TARGET_REF=""
if git rev-parse --verify "origin/$BASE_REF" >/dev/null 2>&1; then
  TARGET_REF="origin/$BASE_REF"
elif git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  TARGET_REF="$BASE_REF"
else
  echo "Fetching origin/$BASE_REF..."
  git fetch origin "$BASE_REF" --depth=50
  TARGET_REF="origin/$BASE_REF"
fi

# Get list of changed files against base ref
echo "Comparing HEAD against $TARGET_REF..."
CHANGED_FILES=$(git diff --name-only "$TARGET_REF...HEAD")

if [ -z "$CHANGED_FILES" ]; then
  echo "✅ No changed files detected."
  exit 0
fi

echo "Changed files detected:"
echo "$CHANGED_FILES"
echo "--------------------------------------------------------"

# Check if application code changed
CODE_CHANGED=false
if echo "$CHANGED_FILES" | grep -E '^(backend|frontend)/' >/dev/null 2>&1; then
  CODE_CHANGED=true
fi

if [ "$CODE_CHANGED" = false ]; then
  echo "✅ No code changes in backend/ or frontend/ detected. Documentation check passed."
  exit 0
fi

echo "🔍 Code changes detected in backend/ or frontend/."

# Check if any documentation was added or modified under docs/
DOCS_CHANGED=false
MATCHED_DOCS=$(echo "$CHANGED_FILES" | grep -E '^docs/' || true)
if [ -n "$MATCHED_DOCS" ]; then
  DOCS_CHANGED=true
fi

if [ "$DOCS_CHANGED" = true ]; then
  echo "✅ Documentation update detected in docs/:"
  echo "$MATCHED_DOCS"
  echo "Documentation compliance check passed!"
  exit 0
fi

# Check for exemption via PR body or label if running in GitHub Actions
EXEMPT=false
if [ -n "${GITHUB_EVENT_PATH:-}" ] && [ -f "$GITHUB_EVENT_PATH" ]; then
  PR_BODY=$(jq -r '.pull_request.body // ""' "$GITHUB_EVENT_PATH" 2>/dev/null || echo "")
  
  # Check if PR body has [x] Exempt or [X] Exempt
  if echo "$PR_BODY" | grep -qiE '\[x\]\s*Exempt'; then
    echo "ℹ️  PR description contains an exemption mark ('[x] Exempt')."
    EXEMPT=true
  fi

  # Check if PR has exemption label
  PR_LABELS=$(jq -r '.pull_request.labels[].name // ""' "$GITHUB_EVENT_PATH" 2>/dev/null || echo "")
  if echo "$PR_LABELS" | grep -qiE '^(skip-doc-check|no-doc-needed|exempt)$'; then
    echo "ℹ️  PR has exemption label."
    EXEMPT=true
  fi
fi

if [ "$EXEMPT" = true ]; then
  echo "✅ PR marked exempt from documentation requirement. Documentation check passed."
  exit 0
fi

# If we reached here, code was modified without docs or exemption
echo ""
echo "❌ ERROR: PR Documentation Check Failed!"
echo "--------------------------------------------------------"
echo "Code was modified in 'backend/' or 'frontend/', but no corresponding documentation was added or updated under 'docs/'."
echo ""
echo "👉 How to resolve:"
echo "1. If this PR introduces a feature, API, schema migration, or UI change:"
echo "   - Add or update technical documentation in 'docs/'."
echo "   - Use 'docs/templates/backend-pr-document-template.md' or 'docs/templates/frontend-pr-document-template.md'."
echo "   - For architectural shifts, add an ADR under 'docs/decisions/'."
echo ""
echo "2. If this PR is a minor bugfix, typo, or chore exempt from docs:"
echo "   - In your GitHub PR description, check the exemption box: '[x] Exempt:'"
echo "   - Or ask a maintainer to apply the 'no-doc-needed' label."
echo ""
echo "Refer to docs/GUIDELINES.md for complete documentation rules."
echo "--------------------------------------------------------"
exit 1
