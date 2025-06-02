import json
from collections import defaultdict
import requests
import os
import sys


def read_json_file(file_path):
    # Load JSON file
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Prepare grouped results by API category
    grouped = defaultdict(list)
    results = data.get("results", {})

    for url, tests in results.items():
        for test in tests:
            name = test.get("name", "N/A")
            result = test.get("result", "N/A")
            exposure = test.get("exposure", "N/A")

            # Extract group name (e.g., api.Animation.* -> Animation)
            parts = name.split(".")
            if len(parts) > 1:
                group = parts[1]
            else:
                group = "Misc"

            grouped[group].append((name, result, exposure, url))

    # Cache for BCD spec URLs to reduce repeated network requests
    spec_cache = {}

    def fetch_spec_url(api_path):
        """Try to get spec URL from MDN BCD JSON via GitHub raw content."""
        if api_path in spec_cache:
            return spec_cache[api_path]

        parts = api_path.split(".")[1:]  # skip 'api' prefix
        if not parts:
            return None

        # Build URL to raw JSON file
        file_path = "/".join(parts[:1])  # e.g., 'Animation'
        json_url = f"https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/{file_path}.json"

        try:
            res = requests.get(json_url)
            if res.status_code != 200:
                spec_cache[api_path] = None
                return None

            bcd_json = res.json()
            current = bcd_json.get("api", {})
            for part in parts:
                current = current.get(part)
                if current is None:
                    break

            spec_url = current.get("spec_url") if isinstance(current, dict) else None
            spec_cache[api_path] = spec_url
            return spec_url

        except Exception:
            spec_cache[api_path] = None
            return None

    # Generate Markdown
    md_lines = ["# API Compatibility Results (Grouped + Spec URL)\n"]

    for group in sorted(grouped):
        md_lines.append(f"### `{group}` APIs\n")
        md_lines.append("| API Feature | Result | Exposure | Source | Spec URL |")
        md_lines.append("|-------------|--------|----------|--------|----------|")

        for name, result, exposure, url in grouped[group]:
            if result is True:
                icon = "✅"
            elif result is False:
                icon = "❌"
            elif result is None:
                icon = "⚠️"
            else:
                icon = str(result)

            spec_url = fetch_spec_url(name)
            spec_md = f"[spec]({spec_url})" if spec_url else "-"
            md_lines.append(f"| `{name}` | {icon} | `{exposure}` | [test]({url}) | {spec_md} |")

        md_lines.append("")

    # Save to markdown
    with open('./content/metrics/css.md', 'a', encoding='utf-8') as file:
        file.write("\n".join(md_lines))


def main(file_path):
    read_json_file(file_path)

if __name__ == '__main__':
    file_path = sys.argv[1]
    main(file_path)