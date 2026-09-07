#!/usr/bin/env python3
"""
Advanced Document Quality & Completeness Validator for The AdBasket.
Validates:
1. No boilerplate template placeholders (e.g., [Feature Title], TODO, @[github_handle]).
2. No unmodified copies of template files.
3. No empty major sections.
4. Balanced markdown code fences (```).
5. Valid Mermaid diagram syntax declarations.
6. No broken internal relative file links.
7. Substantive content length.
"""

import os
import re
import sys
import filecmp
from pathlib import Path
from urllib.parse import urlparse

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
    (re.compile(r"\(Insert short video/GIF", re.IGNORECASE), "Unfilled Media Placeholder: '(Insert short video/GIF)'"),
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

VALID_MERMAID_TYPES = {
    "graph", "flowchart", "sequencediagram", "classdiagram",
    "erdiagram", "statediagram", "statediagram-v2", "gitgraph",
    "pie", "mindmap", "timeline", "journey", "quadrantchart", "c4context"
}

def is_excluded(filepath: str) -> bool:
    norm = os.path.normpath(filepath)
    if norm in EXCLUDED_FILES or norm.startswith("docs/templates/"):
        return True
    return False

def check_relative_link(source_file: Path, link_target: str) -> str | None:
    """Checks if a relative link in markdown points to an existing file."""
    # Strip query and fragments
    parsed = urlparse(link_target)
    target_path = parsed.path
    if not target_path:
        return None  # Anchor-only link (#section)

    if target_path.startswith(("http://", "https://", "mailto:", "ftp:")):
        return None

    # Check relative to source file directory
    resolved = (source_file.parent / target_path).resolve()
    if resolved.exists():
        return None

    # Check relative to repo root
    repo_resolved = (Path.cwd() / target_path.lstrip("/")).resolve()
    if repo_resolved.exists():
        return None

    return f"Broken relative link: '{link_target}' target was not found."

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

    # 3. Check for empty major sections
    section_header_pattern = re.compile(r"^(#{2,3})\s+(.+)$")
    last_header = None
    last_header_line = None

    for line_num, line in enumerate(lines, start=1):
        stripped = line.strip()
        header_match = section_header_pattern.match(stripped)

        if header_match:
            if last_header is not None:
                issues.append(
                    f"Line {last_header_line}: Section '{last_header}' is empty (followed immediately by '{header_match.group(2)}')."
                )
            last_header = header_match.group(2)
            last_header_line = line_num
        elif stripped and not stripped.startswith("<!--") and not stripped.startswith("---"):
            last_header = None
            last_header_line = None

    if last_header is not None:
        issues.append(f"Line {last_header_line}: Section '{last_header}' at the end of the file is empty.")

    # 4. Check balanced code fences and Mermaid diagrams
    fence_count = 0
    in_mermaid = False
    mermaid_start_line = None
    mermaid_has_type = False

    link_pattern = re.compile(r"\[(?:[^\]]+)\]\(([^)]+)\)")

    for line_num, line in enumerate(lines, start=1):
        stripped = line.strip()

        # Check relative links (outside raw code blocks)
        if not (stripped.startswith("```") or in_mermaid):
            for match in link_pattern.finditer(line):
                link_url = match.group(1).strip()
                link_err = check_relative_link(filepath, link_url)
                if link_err:
                    issues.append(f"Line {line_num}: {link_err}")

        # Code block tracking
        if stripped.startswith("```"):
            fence_count += 1
            if stripped.startswith("```mermaid"):
                in_mermaid = True
                mermaid_start_line = line_num
                mermaid_has_type = False
            elif in_mermaid:
                # Closing mermaid fence
                if not mermaid_has_type:
                    issues.append(
                        f"Line {mermaid_start_line}: Mermaid block does not declare a diagram type "
                        f"(e.g., 'graph TD', 'sequenceDiagram', 'classDiagram')."
                    )
                in_mermaid = False
        elif in_mermaid and stripped and not stripped.startswith("%%"):
            first_word = stripped.split()[0].lower().replace(":", "")
            if any(first_word.startswith(t) for t in VALID_MERMAID_TYPES):
                mermaid_has_type = True

    if fence_count % 2 != 0:
        issues.append(f"Unbalanced code fences detected (found {fence_count} ``` delimiters). File formatting may be broken.")

    if in_mermaid:
        issues.append(f"Line {mermaid_start_line}: Unclosed Mermaid code block.")

    # 5. Check substantive content length
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
        print("- Ensure code blocks (```) and Mermaid diagrams are properly opened, typed, and closed.")
        print("- Verify all relative markdown links point to existing files in the repo.")
        print("=" * 60)
        sys.exit(1)

    print("✅ All documentation files are properly filled, structured, and verified!")
    sys.exit(0)

if __name__ == "__main__":
    main()
