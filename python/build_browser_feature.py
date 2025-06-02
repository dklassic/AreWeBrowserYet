import json
from collections import defaultdict
import os
import sys

BCD_REPO_PATH = "./browser-compat-data/"

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
    md_lines = ["# API Compatibility Results\n"]

    for group in sorted(grouped):
        md_lines.append(f"### `{group}` APIs\n")
        md_lines.append("| API Feature | Result | Exposure | Relevant Link |")
        md_lines.append("|-------------|--------|----------|---------------|")

        for name, result, exposure, url in grouped[group]:
            icon = "✅" if result is True else "❌" if result is False else "⚠️"

            url = get_url_from_bcd(name)
            spec_links = []
            if url and url[0]:
                spec_links.append(f"[MDN]({url[0]})")
            if url and isinstance(url[1], list):
                i = 0
                for spec in url[1]:
                    spec_links.append(f"[SPEC{i}]({spec})")
                    i += 1
            elif url and url[1]:
                spec_links.append(f"[SPEC]({url[1]})")
            links = ", ".join(spec_links) if len(spec_links) > 0 else "N/A"

            md_lines.append(f"| `{name}` | {icon} | {exposure} | {links} |")

        md_lines.append("")  # Blank line between groups

    # Save output
    with open("./content/metrics/browser-feature.md", "a", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

def get_url_from_bcd(api_path):
    parts = api_path.split(".")  # skip 'api' prefix
    if not parts:
        return None
    # Construct the path with all parts joined by '/' except the last part
    root_file = "/".join(parts[:-1]) + ".json"
    bcd_path = os.path.join(BCD_REPO_PATH, root_file)

    if not os.path.isfile(bcd_path):
        return None
    try:
        with open(bcd_path, "r", encoding="utf-8") as f:
            bcd_data = json.load(f)

        current = bcd_data.get(parts[0], {})
        for part in parts[1:]:
            if part in current:
                current = current[part]
            else:
                current = None
                break

        mdn_url = current.get("__compat").get("mdn_url")
        spec_url = current.get("__compat").get("spec_url")
        return (mdn_url, spec_url)

    except Exception as e:
        print(f"Error reading BCD for {api_path}: {e}")
        return None

def main(file_path):
    read_json_file(file_path)

if __name__ == '__main__':
    file_path = sys.argv[1]
    main(file_path)