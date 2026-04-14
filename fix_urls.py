"""Fix all hardcoded localhost:8000 URLs in the dashboard frontend."""
import os
import re

dashboard_src = r"c:\Users\kaush\OneDrive\Documents\New folder (18)\Ai_Checker\dashboard\src"
TARGET = "http://localhost:8000"
IMPORT_LINE = 'import { API_BASE } from "@/lib/config";'

files_fixed = []

for root, dirs, files in os.walk(dashboard_src):
    for fname in files:
        if not fname.endswith((".tsx", ".ts")):
            continue
        fpath = os.path.join(root, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()

        if TARGET not in content:
            continue

        # Skip config.ts and api.ts (already handled)
        if fname in ("config.ts", "api.ts"):
            continue

        new_content = content

        # Add import if not present
        if "API_BASE" not in new_content:
            lines = new_content.split("\n")
            last_import_idx = -1
            for i, line in enumerate(lines):
                if line.strip().startswith("import "):
                    last_import_idx = i
            if last_import_idx >= 0:
                lines.insert(last_import_idx + 1, IMPORT_LINE)
            else:
                for i, line in enumerate(lines):
                    if '"use client"' in line or "'use client'" in line:
                        lines.insert(i + 1, IMPORT_LINE)
                        break
            new_content = "\n".join(lines)

        # Replace template literals: `http://localhost:8000/xxx` -> `${API_BASE}/xxx`
        new_content = re.sub(
            r"`http://localhost:8000(/[^`]*)`",
            r"`${API_BASE}\1`",
            new_content,
        )
        # Replace string literals: "http://localhost:8000/xxx" -> `${API_BASE}/xxx`
        new_content = re.sub(
            r'"http://localhost:8000(/[^"]*?)"',
            r"`${API_BASE}\1`",
            new_content,
        )

        if new_content != content:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(new_content)
            count = content.count(TARGET)
            files_fixed.append(f"  {fname}: {count} URLs fixed")

print(f"Fixed {len(files_fixed)} files:")
for f in files_fixed:
    print(f)
