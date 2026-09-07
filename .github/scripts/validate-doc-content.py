#!/usr/bin/env python3
"""
Validates that documentation files added or modified in a PR are properly filled
and do not contain boilerplate placeholders, empty sections, or unmodified templates.
"""

import os
import re
import sys
import filecmp
from pathlib import Path

# Placeholders that indicate an unfilled template
PLACEHOLDER_PATTERNS = [
    (re.compile(r"\[Feature\s*/\s*Task Title\]", re.IGNORECASE), "Unfilled Title: '[Feature / Task Title]'"),
    (re.compile(r"@\[github_handle\]", re.IGNORECASE), "Unfilled Author: '@[github_handle]'"),
    (re.compile(r"\[#?PR_NUMBER", re.IGNORECASE), "Unfilled PR Reference: '[#PR_NUMBER]'"),
    (re.compile(r"\[PR\s*#\s*/\s*JIRA", re.IGNORECASE), "Unfilled Ticket Reference: '[PR # / JIRA-]'"),
    (re.compile(r"\[Short Title of the Decision\]", re.IGNORECASE), "Unfilled ADR Title: '[Short Title of the Decision]'"),
    (re.compile(r"\[METHOD\]\s*/api/", re.IGNORECASE), "Unfilled HTTP Method: '[METHOD]'"),
    (re.compile(r"/\[subpackage\]", re.IGNORECASE), "Unfilled Subpackage: '[subpackage]'"),
    (re.compile(r"\[TestClassName\]", re.IGNORECASE), "Unfilled Test Class Name: '[TestClassName]'"),
    (re.compile(r"/\[route\]", re.IGNORECASE), "Unfilled Route: '[route]'"),
    (re.compile(r"\[Option\s*\d", re.IGNORECASE), "Unfilled ADR Option: '[Option X]'"),
    (re.compile(r"url_or_drag_image", re.IGNORECASE), "Unfilled UI Screenshot: 'url_or_drag_image'"),
    (re.compile(r"\bTODO\b", re.IGNORECASE), "Unresolved TODO keyword"),
    (re.compile(r"\bTBD\b", re.IGNORECASE), "Unresolved TBD keyword"),
]

EXCLUDED_FILES = {
    "README.md",
    "docs/README.md",
    "docs/GUIDELINES.md",
    "frontend/README.md",
}

TEMPLATE_DIR = Path("docs/templates")

def is_excluded(filepath: str) -> bool:
    norm = os.path.normpath(filepath)
    if norm in EXCLUDED_FILES or norm.startswith("docs/templates/"):
        return True
    return False

def check_file(filepath: Path) -> list[str]:
    issues = []

    if not filepath.exists():
        return issues

    # 1. Check if identical to any template in docs/templates
    if TEMPLATE_DIR.exists():
        for tmpl in TEMPLATE_DIR.glob("*.md"):
            if filecmp.cmp(filepath, tmpl, shallow=False):
                issues.append(
                    f"File is an exact, unedited copy of template '{tmpl}'. "
                    "Please fill in the details for your change."
                )
                return issues

    try:
        content = filepath.read_text(encoding="utf-8")
    except Exception as e:
        issues.append(f"Failed to read file: {e}")
        return issues

    lines = content.splitlines()

    # 2. Check for placeholder patterns line by line
    for line_num, line in enumerate(lines, start=1):
        for pattern, desc in PLACEHOLDER_PATTERNS:
            if pattern.search(line):
                issues.append(f"Line {line_num}: Contains {desc} -> `{line.strip()}`")

    # 3. Check for empty major sections (e.g., "## Header" followed immediately by another "## Header")
    section_header_pattern = re.compile(r"^(#{2,3})\s+(.+)$")
    last_header = None
    last_header_line = None

    for line_num, line in enumerate(lines, start=1):
        stripped = line.strip()
        header_match = section_header_pattern.match(stripped)

        if header_match:
            if last_header is not None:
                # Two consecutive headers with nothing in between
                issues.append(
                    f"Line {last_header_line}: Section '{last_header}' is empty (followed immediately by '{header_match.group(2)}')."
                )
            last_header = header_match.group(2)
            last_header_line = line_num
        elif stripped and not stripped.startswith("<!--") and not stripped.startswith("---"):
            # Non-empty non-comment content encountered; header has content
            last_header = None
            last_header_line = None

    # If the file ended with a header and no content
    if last_header is not None:
        issues.append(f"Line {last_header_line}: Section '{last_header}' at the end of the file is empty.")

    # 4. Check substantive content length (non-empty, non-header, non-delimiter lines)
    substantive_lines = [
        line.strip()
        for line in lines
        if line.strip()
        and not line.strip().startswith("#")
        and not line.strip().startswith("---")
        and not line.strip().startswith("<!--")
    ]
    if len(substantive_lines) < 5:
        issues.append(
            f"Document has only {len(substantive_lines)} substantive lines of content. "
            "Please provide a comprehensive explanation."
        )

    return issues

def main():
    if len(sys.argv) < 2:
        print("No files provided for validation.")
        sys.exit(0)

    files_to_check = [
        Path(f) for f in sys.argv[1:]
        if f.endswith(".md") and not is_excluded(f)
    ]

    if not files_to_check:
        print("✅ No user-authored documentation files to validate.")
        sys.exit(0)

    print(f"🔍 Validating {len(files_to_check)} documentation file(s) for completeness...")
    all_errors = {}

    for doc_file in files_to_check:
        file_issues = check_file(doc_file)
        if file_issues:
            all_errors[str(doc_file)] = file_issues

    if all_errors:
        print("\n❌ Documentation Completeness Validation FAILED!")
        print("=" * 60)
        for doc_file, issues in all_errors.items():
            print(f"\n📄 {doc_file}:")
            for issue in issues:
                print(f"   ⚠️  {issue}")
        print("\n" + "=" * 60)
        print("👉 How to resolve:")
        print("- Replace all placeholder values (e.g., [Feature Title], @[github_handle], TODO, etc.).")
        print("- Fill in all section headers with detailed explanations.")
        print("- Ensure the file is not an unmodified copy of a template.")
        print("=" * 60)
        sys.exit(1)

    print("✅ All documentation files are properly filled and verified!")
    sys.exit(0)

if __name__ == "__main__":
    main()
