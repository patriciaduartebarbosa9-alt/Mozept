# GitHub Copilot Instructions for Mustache Website Generator

## 1. Project Overview
- This repo implements a **custom static site generator** using Mustache templates and JSON data.
- Core components:
  - `compile.js`: Node.js script that reads `templates/`, `partials/`, and `data/` directories to produce static HTML in `output/`.
  - `templates/`: Holds layouts (`layouts/`), page templates (`pages/`), and reusable partials (`partials/`).
  - `templates/data/`: Mirrors page structure with JSON files providing content.
  - `assets/`: CSS, images, and JS copied verbatim to `output/assets/`.

## 2. Build & Development Workflow
1. **Install dependencies**: `npm install`
2. **Configure** (optional): Adjust `settings.json` under `mustache.compiler` for paths or base URL.
3. **Generate site**: `npm run build` (alias for `node compile.js`).
4. **Preview**: Serve `output/` folder using any HTTP server (e.g., `npx serve output`).

> *Tip: `settings.json` defines input/output paths, e.g., `templates`, `partials`, `data` directories.*

## 3. Template Patterns & Conventions
- **Layout inheritance**: In page templates, use `{{< layoutName}}` to extend `templates/layouts/layoutName.mustache`.
- **Block overrides**: Define or override sections with `{{$blockName}}...{{/blockName}}`. Layouts use the same syntax as placeholders.
- **Partials**: Insert shared components via `{{> partialName}}`, e.g., header (`templates/partials/header.mustache`) and styles includes (`templates/partials/styles.mustache`).
- **Disabling HTML escape**: Compiler overrides `Mustache.escape` to allow raw HTML in JSON values.

## 4. Data Directory Structure
- JSON files in `templates/data/` match page paths:
  - `templates/data/index.json` → `templates/pages/index.mustache` → `output/index.html`
  - `templates/data/blog/article.json` → `templates/pages/blog/article.mustache`
- Arrays in JSON can drive loops in templates: `{{#styles}}...{{/styles}}` in `styles.mustache` to include CSS links.

## 5. Asset & Script Inclusion
- CSS and JS includes are managed in partials:
  - `templates/partials/styles.mustache` loops over `styles` array from JSON (example: `{{#styles}}<link ...>{{/styles}}`).
  - `templates/partials/scripts.mustache` loops over `scripts` array.
- Image paths in JSON are made absolute using `siteUrl` conversion (`convertRelativeToAbsolute` in `compile.js`).

## 6. API & Clients Integration
- Server-side PHP API under `api/` (e.g., `api/gallery.php`, `api/list-clients.php`) supports dynamic client data.
- Client-side logic in `assets/js/insert-client.js` communicates via fetch to `api/insert_client.php`.

## 7. Key Files & Directories
```
compile.js             # main build script
settings.json          # compiler configuration
templates/
  layouts/
  pages/
  partials/            # shared components (header, footer, styles, scripts)
  data/                # JSON content sources
assets/
  css/
  js/
  images/
output/                # generated static site
```

---
