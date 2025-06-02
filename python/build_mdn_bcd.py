import json
from collections import defaultdict
import os
import sys

# === CONFIG: Path to your local BCD repo clone ===
BCD_REPO_PATH = "./browser-compat-data/api"
# Cache spec URLs to avoid redundant reads
spec_cache = {}

def read_json_file(file_path):
    # Load test results JSON file
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Organize test data by API group
    grouped = defaultdict(list)
    results = data.get("results", {})

    for url, tests in results.items():
        for test in tests:
            name = test.get("name", "N/A")
            result = test.get("result", "N/A")
            exposure = test.get("exposure", "N/A")

            parts = name.split(".")
            group = parts[1] if len(parts) > 1 else "Misc"

            grouped[group].append((name, result, exposure, url))

    # Generate Markdown output
    md_lines = ["# API Compatibility Results (Grouped + Spec URL)\n"]

    for group in sorted(grouped):
        md_lines.append(f"### `{group}` APIs\n")
        md_lines.append("| API Feature | Result | Exposure | Source | Spec URL |")
        md_lines.append("|-------------|--------|----------|--------|----------|")

        for name, result, exposure, url in grouped[group]:
            icon = "✅" if result is True else "❌" if result is False else "⚠️"

            spec_url = get_spec_url_from_bcd(name)
            spec_md = f"[spec]({spec_url})" if spec_url else "-"

            md_lines.append(f"| `{name}` | {icon}| {spec_md} |")

        md_lines.append("")  # Blank line between groups

    # Save output
    with open("./content/metrics/browser-feature.md", "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

def get_spec_url_from_bcd(api_path):
    """Look up the spec_url for a given API path using a local BCD repo."""
    if api_path in spec_cache:
        return spec_cache[api_path]

    parts = api_path.split(".")[1:]  # skip 'api' prefix
    if not parts:
        return None
    root_file = "/".join(parts) + ".json"
    bcd_path = os.path.join(BCD_REPO_PATH, root_file)
    print(f"bcd_path")

    if not os.path.isfile(bcd_path):
        spec_cache[api_path] = None
        return None

    try:
        with open(bcd_path, "r", encoding="utf-8") as f:
            bcd_data = json.load(f)

        current = bcd_data.get("api", {})
        for part in parts:
            if part in current:
                current = current[part]
            else:
                current = None
                break

        spec_url = current.get("spec_url") if isinstance(current, dict) else None
        spec_cache[api_path] = spec_url
        return spec_url

    except Exception as e:
        print(f"Error reading BCD for {api_path}: {e}")
        spec_cache[api_path] = None
        return None

def main(file_path):
    read_json_file(file_path)

if __name__ == '__main__':
    file_path = sys.argv[1]
    main(file_path)