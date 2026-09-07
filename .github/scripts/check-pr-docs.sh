#!/usr/bin/env bash
set -euo pipefail

echo "========================================================"
echo "    The AdBasket — PR Documentation Compliance Check    "
echo "========================================================"

EVENT_NAME="${GITHUB_EVENT_NAME:-local}"
BASE_REF="${GITHUB_BASE_REF:-master}"
STEP_SUMMARY="${GITHUB_STEP_SUMMARY:-}"

log_summary() {
  if [ -n "$STEP_SUMMARY" ] && [ -w "$STEP_SUMMARY" ]; then
    echo -e "$1" >> "$STEP_SUMMARY"
  fi
}

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

# Get list of added/modified files (excluding deleted files to avoid file-not-found errors)
echo "Comparing HEAD against $TARGET_REF..."
CHANGED_FILES=$(git diff --diff-filter=d --name-only "$TARGET_REF...HEAD")
DELETED_FILES=$(git diff --diff-filter=D --name-only "$TARGET_REF...HEAD")

if [ -z "$CHANGED_FILES" ] && [ -z "$DELETED_FILES" ]; then
  echo "✅ No changed files detected."
  log_summary "### 📋 PR Documentation Check: Passed\n\nNo file changes detected."
  exit 0
fi

echo "Changed files detected (Added/Modified):"
echo "$CHANGED_FILES"
if [ -n "$DELETED_FILES" ]; then
  echo "Deleted files:"
  echo "$DELETED_FILES"
fi
echo "--------------------------------------------------------"

# 1. Classify Changes
CODE_CHANGED=false
if echo "$CHANGED_FILES $DELETED_FILES" | grep -E '^(backend|frontend)/' | grep -vE '\.(md|markdown)$' >/dev/null 2>&1; then
  CODE_CHANGED=true
  echo "🔍 Application code changes detected in backend/ or frontend/."
fi

CONFIG_CHANGED=false
if echo "$CHANGED_FILES $DELETED_FILES" | grep -E '(docker-compose.*\.ya?ml|\.env.*|\.github/workflows/.*|Dockerfile.*|nginx.*\.conf)' >/dev/null 2>&1; then
  CONFIG_CHANGED=true
  echo "⚙️  Configuration or infrastructure changes detected."
fi

DB_MIGRATION_CHANGED=false
if echo "$CHANGED_FILES" | grep -E 'backend/src/main/resources/db/migration/V.*\.sql$' >/dev/null 2>&1; then
  DB_MIGRATION_CHANGED=true
  echo "🗄️  Flyway database migration detected."
fi

# 2. Check for Documentation changes (docs/ directory or project READMEs)
DOCS_CHANGED=false
MATCHED_DOCS=$(echo "$CHANGED_FILES" | grep -E '(^docs/.*\.md$|README\.md$)' || true)

if [ -n "$MATCHED_DOCS" ]; then
  DOCS_CHANGED=true
  echo "📄 Documentation files detected in PR:"
  echo "$MATCHED_DOCS"
  echo ""
  echo "🔍 Validating documentation files for completeness, code fences, links, and placeholders..."
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  python3 "$SCRIPT_DIR/validate-doc-content.py" $MATCHED_DOCS
  echo "✅ Documentation files verified."

  # Validate PR document naming convention under docs/prs/
  PR_DOCS=$(echo "$MATCHED_DOCS" | grep -E '^docs/prs/' || true)
  if [ -n "$PR_DOCS" ]; then
    PR_NUMBER=""
    if [ -n "${GITHUB_EVENT_PATH:-}" ] && [ -f "$GITHUB_EVENT_PATH" ]; then
      PR_NUMBER=$(jq -r '.pull_request.number // ""' "$GITHUB_EVENT_PATH" 2>/dev/null || echo "")
    fi

    INVALID_NAMES=false
    while IFS= read -r doc_file; do
      [ -z "$doc_file" ] && continue
      filename=$(basename "$doc_file")
      
      if [ -n "$PR_NUMBER" ]; then
        # When running in GitHub Actions PR context: must match current PR number
        if ! echo "$filename" | grep -qiE "^PR-${PR_NUMBER}-.+[a-z0-9]\.md$"; then
          echo "❌ Invalid PR doc filename: '$doc_file'"
          echo "   Expected pattern: 'docs/prs/PR-${PR_NUMBER}-<short-description>.md'"
          INVALID_NAMES=true
        fi
      else
        # When running locally: must match general PR-<number>-<description>.md pattern
        if ! echo "$filename" | grep -qiE "^PR-[0-9]+-.+[a-z0-9]\.md$"; then
          echo "❌ Invalid PR doc filename: '$doc_file'"
          echo "   Expected pattern: 'docs/prs/PR-<number>-<short-description>.md'"
          INVALID_NAMES=true
        fi
      fi
    done <<< "$PR_DOCS"

    if [ "$INVALID_NAMES" = true ]; then
      echo ""
      echo "❌ ERROR: PR document filenames must follow the 'docs/prs/PR-<number>-<title>.md' convention."
      log_summary "### ❌ PR Documentation Check: FAILED\n\n> ⚠️ **Invalid File Name:** PR document under \`docs/prs/\` must follow \`docs/prs/PR-<number>-<name>.md\` matching the PR number."
      exit 1
    fi
    echo "✅ PR document naming convention verified."
  fi
fi

# 3. Handle Pure Documentation PRs
if [ "$CODE_CHANGED" = false ] && [ "$CONFIG_CHANGED" = false ] && [ "$DOCS_CHANGED" = true ]; then
  echo ""
  echo "✅ Pure documentation PR detected. All documents passed quality verification."
  log_summary "### 📋 PR Documentation Check: Passed\n\n- **Category:** 📖 Pure Documentation\n- **Status:** All documentation files passed syntax, completeness, and link verification."
  exit 0
fi

# 4. Handle Pure Repository Meta / Chores (e.g. .gitignore, .vscode)
if [ "$CODE_CHANGED" = false ] && [ "$CONFIG_CHANGED" = false ] && [ "$DOCS_CHANGED" = false ]; then
  echo ""
  echo "✅ Repository maintenance or metadata changes only. Documentation check passed."
  log_summary "### 📋 PR Documentation Check: Passed\n\n- **Category:** 🧹 Repository Maintenance / Metadata\n- **Status:** No documentation required for repository metadata changes."
  exit 0
fi

# 5. If Code or Configuration changed, and valid documentation is included -> PASS
if [ "$DOCS_CHANGED" = true ]; then
  echo ""
  echo "✅ Code/Configuration changes accompanied by verified documentation. Check passed!"
  log_summary "### 📋 PR Documentation Check: Passed\n\n- **Application Code Changed:** $CODE_CHANGED\n- **Configuration Changed:** $CONFIG_CHANGED\n- **Database Migration Changed:** $DB_MIGRATION_CHANGED\n- **Status:** ✅ Valid documentation included and verified."
  exit 0
fi

# 6. Check for explicit Exemption via PR description or label
EXEMPT=false
EXEMPT_REASON=""
if [ -n "${GITHUB_EVENT_PATH:-}" ] && [ -f "$GITHUB_EVENT_PATH" ]; then
  PR_BODY=$(jq -r '.pull_request.body // ""' "$GITHUB_EVENT_PATH" 2>/dev/null || echo "")
  
  if echo "$PR_BODY" | grep -qiE '\[x\]\s*Exempt'; then
    EXEMPT_REASON=$(echo "$PR_BODY" | grep -iE '\[x\]\s*Exempt' | head -n 1)
    echo "ℹ️  PR description contains an exemption mark: $EXEMPT_REASON"
    EXEMPT=true
  fi

  PR_LABELS=$(jq -r '.pull_request.labels[].name // ""' "$GITHUB_EVENT_PATH" 2>/dev/null || echo "")
  if echo "$PR_LABELS" | grep -qiE '^(skip-doc-check|no-doc-needed|exempt)$'; then
    echo "ℹ️  PR has exemption label."
    EXEMPT=true
    EXEMPT_REASON="Exemption label attached to PR"
  fi
fi

if [ "$EXEMPT" = true ]; then
  echo ""
  echo "✅ PR marked exempt from documentation requirement ($EXEMPT_REASON). Documentation check passed."
  log_summary "### 📋 PR Documentation Check: Passed (Exempt)\n\n- **Exemption Rationale:** $EXEMPT_REASON\n- **Note:** Exemption accepted for this pull request."
  exit 0
fi

# 7. Failure: Code or Configuration was modified without documentation or exemption
echo ""
echo "❌ ERROR: PR Documentation Check Failed!"
echo "--------------------------------------------------------"
if [ "$CODE_CHANGED" = true ]; then
  echo "• Application code was modified in 'backend/' or 'frontend/'."
fi
if [ "$CONFIG_CHANGED" = true ]; then
  echo "• Infrastructure or environment configuration was modified (Docker/Compose/CI/env)."
fi
if [ "$DB_MIGRATION_CHANGED" = true ]; then
  echo "• Flyway database migration script was added without schema documentation."
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
echo "   - In your GitHub PR description, check the exemption box: '[x] Exempt: [reason]'"
echo "   - Or ask a maintainer to apply the 'no-doc-needed' label."
echo ""
echo "Refer to docs/GUIDELINES.md for complete documentation rules."
echo "--------------------------------------------------------"

log_summary "### ❌ PR Documentation Check: FAILED\n\n| Check | Status |\n| :--- | :--- |\n| Application Code Changed | \`$CODE_CHANGED\` |\n| Configuration Changed | \`$CONFIG_CHANGED\` |\n| Database Migration Changed | \`$DB_MIGRATION_CHANGED\` |\n| Documentation Updated | \`$DOCS_CHANGED\` |\n| Exemption Declared | \`$EXEMPT\` |\n\n> ⚠️ **Action Required:** Code/configuration was changed without documentation or exemption. Please add/update docs under \`docs/\` or mark \`[x] Exempt: [reason]\` in the PR description."

exit 1
