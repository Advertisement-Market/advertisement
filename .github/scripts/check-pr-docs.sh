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

# 1. Check for Application Code changes (backend/ or frontend/)
CODE_CHANGED=false
if echo "$CHANGED_FILES" | grep -E '^(backend|frontend)/' | grep -vE '\.(md|markdown)$' >/dev/null 2>&1; then
  CODE_CHANGED=true
  echo "🔍 Application code changes detected in backend/ or frontend/."
fi

# 2. Check for Configuration & Infrastructure changes
CONFIG_CHANGED=false
if echo "$CHANGED_FILES" | grep -E '(docker-compose.*\.ya?ml|\.env.*|\.github/workflows/.*|Dockerfile.*|nginx.*\.conf)' >/dev/null 2>&1; then
  CONFIG_CHANGED=true
  echo "⚙️  Configuration or infrastructure changes detected."
fi

# 3. Check for Documentation changes (docs/ directory or project READMEs)
DOCS_CHANGED=false
MATCHED_DOCS=$(echo "$CHANGED_FILES" | grep -E '(^docs/.*\.md$|README\.md$)' || true)

if [ -n "$MATCHED_DOCS" ]; then
  DOCS_CHANGED=true
  echo "📄 Documentation files detected in PR:"
  echo "$MATCHED_DOCS"
  echo ""
  echo "🔍 Validating documentation files for completeness and placeholders..."
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  python3 "$SCRIPT_DIR/validate-doc-content.py" $MATCHED_DOCS
  echo "✅ Documentation files verified."
fi

# 4. Handle Pure Documentation PRs
if [ "$CODE_CHANGED" = false ] && [ "$CONFIG_CHANGED" = false ] && [ "$DOCS_CHANGED" = true ]; then
  echo ""
  echo "✅ Pure documentation PR detected. All documents passed quality verification."
  exit 0
fi

# 5. Handle Pure Repository Meta / Chores (e.g. .gitignore, .vscode)
if [ "$CODE_CHANGED" = false ] && [ "$CONFIG_CHANGED" = false ] && [ "$DOCS_CHANGED" = false ]; then
  echo ""
  echo "✅ Repository maintenance or metadata changes only. Documentation check passed."
  exit 0
fi

# 6. If Code or Configuration changed, and valid documentation is included -> PASS
if [ "$DOCS_CHANGED" = true ]; then
  echo ""
  echo "✅ Code/Configuration changes accompanied by verified documentation. Check passed!"
  exit 0
fi

# 7. Check for explicit Exemption via PR description or label
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
  echo ""
  echo "✅ PR marked exempt from documentation requirement. Documentation check passed."
  exit 0
fi

# 8. Failure: Code or Configuration was modified without documentation or exemption
echo ""
echo "❌ ERROR: PR Documentation Check Failed!"
echo "--------------------------------------------------------"
if [ "$CODE_CHANGED" = true ]; then
  echo "• Application code was modified in 'backend/' or 'frontend/'."
fi
if [ "$CONFIG_CHANGED" = true ]; then
  echo "• Infrastructure or environment configuration was modified (Docker/Compose/CI/env)."
fi
echo ""
echo "No corresponding documentation was added or updated under 'docs/' or in 'README.md'."
echo ""
echo "👉 How to resolve:"
echo "1. If this PR introduces a feature, API, schema migration, or configuration change:"
echo "   - Add or update technical documentation in 'docs/' or 'README.md'."
echo "   - Use 'docs/templates/backend-pr-document-template.md' or 'docs/templates/frontend-pr-document-template.md'."
echo "   - For architectural shifts, add an ADR under 'docs/decisions/'."
echo ""
echo "2. If this is a routine config tweak, minor bugfix, typo, or chore exempt from docs:"
echo "   - In your GitHub PR description, check the exemption box: '[x] Exempt:'"
echo "   - Or ask a maintainer to apply the 'no-doc-needed' label."
echo ""
echo "Refer to docs/GUIDELINES.md for complete documentation rules."
echo "--------------------------------------------------------"
exit 1
