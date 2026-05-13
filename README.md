# AreWeBrowserYet

**AreWeBrowserYet** is a tracking website ([arewebrowseryet.com](https://arewebrowseryet.com)) that monitors and visualizes the development progress of the [Servo browser engine](https://github.com/servo/servo). It answers the question: *"How close is Servo to being a usable browser?"* by comparing Servo's web feature support against real-world usage popularity data.

The site is automatically rebuilt weekly using the latest Servo nightly binary, so the data is always current.

## Metrics Tracked

### CSS Feature Coverage (`/metrics/css`)

Cross-references three data sources to show how many CSS properties Servo supports, ranked by real-world usage:

- **Servo's supported CSS properties** from `doc.servo.org/stylo/css-properties.json`
- **CSS usage popularity** from ChromeStatus anonymous usage statistics
- **W3C CSS property specs** from `w3.org/Style/CSS/all-properties.en.json`

Each property is listed with its usage percentage, Servo support status (✅/⚠️/❌), and a link to the relevant W3C spec.

### Browser Feature Coverage (`/metrics/browser-feature`)

Runs the [mdn-bcd-collector](https://mdn-bcd-collector.gooborg.com/) test suite against Servo nightly to check Web API support, then ranks results by real-world usage:

- Servo nightly is run headlessly against a local BCD collector server
- Results are mapped to the `web-features` package's BCD keys
- Features are ranked by popularity data from ChromeStatus
- Each feature links to its MDN documentation and relevant W3C/WHATWG specs
- Results are broken down per execution context (Window, Worker, ServiceWorker, SharedWorker)
- The raw BCD test result JSON is published at [`/bcd-test-results.json`](https://arewebrowseryet.com/bcd-test-results.json) each build

### Full API List (`/metrics/browser-feature-full`)

A comprehensive list of all BCD APIs grouped by category, with MDN and spec links sourced from the [mdn/browser-compat-data](https://github.com/mdn/browser-compat-data) submodule.

## How It Works

### Data Pipeline

```
Servo nightly binary
        │
        ▼
mdn-bcd-collector (local server)
        │  scripts/test.js (userscript automation)
        ▼
Raw BCD test results (JSON)
        │
        ▼
servo-bcd-scripts/feature-tag.ts
   Maps results → web-features + ChromeStatus popularity
        │
        ▼
servo-bcd-scripts/to_md.ts
   Generates markdown table
        │
        ▼
python/build_css.py + python/build_browser_feature.py
   Generate final content pages
        │
        ▼
Zola static site → GitHub Pages
```

### Automation

The GitHub Actions workflow (`.github/workflows/build-and-deploy.yml`) runs **every Saturday at 08:05 UTC**, on push to `main`, and on demand. It:

1. Clones the `mdn-bcd-collector` repo and installs Servo's runtime dependencies
2. Downloads the latest Servo nightly Linux binary
3. Starts the BCD collector server locally and runs Servo headlessly against it
4. Extracts the JSON test results, copies them to `static/bcd-test-results.json` for public download, and maps them to popularity-ranked web features
5. Fetches CSS/spec data and runs the Python build scripts
6. Builds and deploys the Zola site to GitHub Pages

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Static site generator | [Zola](https://www.getzola.org/) |
| Theme | [Duckquill](https://codeberg.org/daudix/duckquill) (git submodule) |
| Data processing (CSS) | Python 3 |
| Data processing (BCD/features) | TypeScript 5 / Node.js 20 |
| Key npm packages | `web-features`, `node-fetch` |
| CI/CD | GitHub Actions |
| Hosting | GitHub Pages |
| Browser under test | Servo nightly (`servo-x86_64-linux-gnu`) |
| BCD test harness | [mdn-bcd-collector](https://github.com/openwebdocs/mdn-bcd-collector) |

## Project Structure

```
.
├── .github/workflows/
│   └── build-and-deploy.yml      # CI/CD pipeline
├── browser-compat-data/          # MDN BCD submodule (spec/MDN URL source)
├── content/
│   ├── _index.md                 # Home page
│   └── metrics/
│       ├── css.md                # CSS coverage page (header; body auto-generated)
│       ├── browser-feature.md    # Popularity-ranked feature page
│       └── browser-feature-full.md  # Full API list
├── python/
│   ├── build_css.py              # Generates CSS coverage markdown
│   └── build_browser_feature.py # Generates full BCD API markdown
├── scripts/
│   └── test.js                   # Servo userscript for BCD collector automation
├── servo-bcd-scripts/
│   ├── feature-tag.ts            # Maps BCD results to web-features + popularity
│   └── to_md.ts                  # Converts ranked data to markdown table
├── static/                       # Static assets + CNAME
│   │                             # bcd-test-results.json published here each build
├── themes/duckquill/             # Zola theme submodule
├── config.toml                   # Zola site configuration
└── package.json                  # Node.js scripts (build, tag, to-md)
```

## Local Development

**Prerequisites:** Zola, Node.js 20+, pnpm, Python 3

```bash
# Install Node.js dependencies
pnpm install

# Build TypeScript
pnpm build

# Serve the site locally
zola serve
```

The content pages under `content/metrics/` are auto-generated by the CI pipeline. To regenerate them locally you would need to run the full data pipeline (download Servo nightly, run BCD collector, etc.) as described in the GitHub Actions workflow.

## Roadmap

- [x] Setup a GitHub page
- [x] Rework to be built with Zola
- [x] Automatic rebuilding every week
- [x] Host the page on a better domain
- [x] Add supported HTML/JS API tracking
- [x] Improve frontend presentation
- [ ] Add performance tracking
