# Technology Stack

**Analysis Date:** 2026-03-11

## Languages

**Primary:**
- JavaScript (ES6 modules) - Frontend client-side application
- HTML5 - Application markup and structure
- CSS3 - Application styling (responsive design)

**Secondary:**
- YAML - Docker/Kubernetes/Skaffold configuration
- Dockerfile - Container images (Nginx and Node.js variants)

## Runtime

**Environment:**
- Browser (client-side): Modern JavaScript runtime supporting ES6 modules, Promise, Symbol, Object.setPrototypeOf
- Docker: Node.js 16-alpine or Nginx 1.16.0-alpine for container deployment
- Kubernetes: via Minikube support

**Package Manager:**
- Not applicable - pure JavaScript (no package.json for frontend dependencies)
- Dependencies loaded via CDN/jsDelivr at runtime

## Frameworks

**Core:**
- Vue.js 3 - UI framework (via CDN: https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js)
- Vue I18n 9 - Internationalization plugin (via CDN: https://unpkg.com/vue-i18n@9/dist/vue-i18n.global.prod.js)

**UI Components:**
- Bootstrap 4.3.1 - CSS framework and responsive grid (via CDN: https://stackpath.bootstrapcdn.com/bootstrap/4.3.1)
- jQuery 3.3.1 - DOM manipulation for Bootstrap tooltips (via CDN)
- Font Awesome - Icon library (https://kit.fontawesome.com/10808f8e76.js)
- Popper.js 1.14.7 - Bootstrap dropdown/tooltip positioning

**HTTP Client:**
- SuperAgent - HTTP request library for API calls (via CDN: https://cdn.jsdelivr.net/npm/superagent)

**Date/Time:**
- Luxon 2 - Date and time manipulation library (via CDN: https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js)

**Utilities:**
- Lodash-ES - Functional utility library (via CDN: https://cdn.jsdelivr.net/npm/lodash-es)
- LZ-String - String compression library (via CDN: https://cdn.jsdelivr.net/npm/lz-string)
- UUID - UUID generation library (via CDN: https://cdn.jsdelivr.net/npm/uuid@8.3.2)

**Payment Processing:**
- Square Payment Form API (v2) - Payment processing for donations (https://js.squareup.com/v2/paymentform)

**DI/Configuration:**
- @alt-javascript/cdi - Dependency injection container (via CDN: https://cdn.jsdelivr.net/npm/@alt-javascript/cdi)
- @alt-javascript/config - Configuration management (v2, via CDN)
- @alt-javascript/logger - Logging framework (v2.0.3, via CDN)
- @alt-javascript/cookies - Cookie management utilities (via CDN)

**Build/Dev:**
- Skaffold - Kubernetes development workflow (v2beta24)
- Docker - Container build and deployment
- http-server (Node.js) - Simple static server for development

## Key Dependencies

**Critical:**
- Vue.js 3 - Entire UI framework and component system; drives all user-facing functionality
- SuperAgent - All API communication to backend server at `http://127.0.0.1:8081/`
- Luxon 2 - All date/calendar calculations and formatting
- @alt-javascript/cdi - Application startup and dependency injection

**Infrastructure:**
- @alt-javascript/cookies - LocalStorage/cookie persistence via `StorageLocal` service
- @alt-javascript/config - Environment-specific configuration loading
- @alt-javascript/logger - Structured logging throughout application
- LZ-String - String compression for localStorage (compact cookie storage)
- Bootstrap 4 - Responsive layout and modal dialogs
- Square Payment Form - Payment processing for donations

## Configuration

**Environment:**
- Configuration loaded via `@alt-javascript/config` from `js/config/config.js`
- Supports environment-specific profiles (e.g., localhost with different CORS/samesite settings)
- Default config: API URL at `http://127.0.0.1:8081/`

**Key Configuration (from `js/config/config.js`):**
- `api.url` - Backend API endpoint (default: `http://127.0.0.1:8081/`)
- `cookies.samesite` - Cookie SameSite policy (default: `Strict`, localhost: `None; Secure`)
- `logging.level` - Log level configuration by module (default warn level at root)

**Build:**
- `Dockerfile-nginx-16-alpine` - Production container: Nginx serving static files
- `Dockerfile-node-16-alpine` - Development container: Node.js http-server
- `skaffold.yaml` - Kubernetes deployment configuration with local development and node profiles
- `.dockerignore` - Build context exclusions

## Platform Requirements

**Development:**
- Browser with ES6 module support (Chrome, Firefox, Safari, Edge modern versions)
- Node.js 16 (for development server) or local HTTP server
- Docker (for containerized development)
- Minikube (for Kubernetes development)

**Production:**
- Nginx 1.16.0-alpine container or any static HTTP server
- Amazon CloudFront CDN (current production hosting at `https://d1uamxeylh4qir.cloudfront.net/`)
- Backend API server at configured `api.url`

**Browser Polyfills:**
- Polyfill.io for: Array.from, Promise, Symbol, Object.setPrototypeOf, Object.getOwnPropertySymbols

---

*Stack analysis: 2026-03-11*
