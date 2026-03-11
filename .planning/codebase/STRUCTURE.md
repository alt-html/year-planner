# STRUCTURE.md — Directory Layout & Organization

## Top-Level Layout

```
year-planner/
├── index.html          # Single-page app entry point; all Vue templates inline here
├── manifest.json       # PWA manifest
├── css/
│   ├── main.css        # Primary styles
│   ├── yp-dark.css     # Dark theme overrides
│   ├── sqpaymentform.css  # Square payment form styles
│   └── typeaheadjs.css # Typeahead search styles
├── js/
│   ├── main.js         # Bootstrap: CDI container init, app mount
│   ├── Application.js  # Top-level wiring: i18n, storage, Vue model
│   ├── config/
│   │   ├── config.js   # Environment-aware config factory
│   │   └── contexts.js # CDI context definitions (all service bindings)
│   ├── service/
│   │   ├── Api.js      # REST API client (auth, sync, donations)
│   │   ├── Storage.js  # Abstract storage interface
│   │   ├── StorageLocal.js   # localStorage/cookie persistence
│   │   ├── StorageRemote.js  # Cloud sync via Api
│   │   └── SquareUp.js       # Square payment integration
│   ├── util/
│   │   └── urlparam.js # URL parameter parsing utilities
│   └── vue/
│       ├── app.js      # Vue app factory and mount
│       ├── model.js    # Reactive data model (all app state)
│       ├── controller.js      # Vue methods: planners, entries, navigation
│       ├── model-features.js  # Feature flags
│       ├── i18n.js     # i18n setup and locale initialization
│       ├── i18n/
│       │   ├── messages.js    # i18n message loader (aggregates language files)
│       │   ├── en/
│       │   │   ├── month.js   # English month names
│       │   │   └── day.js     # English day names
│       │   ├── en.js          # English translations
│       │   ├── zh.js          # Chinese (Traditional)
│       │   ├── hi.js          # Hindi
│       │   ├── ar.js          # Arabic
│       │   ├── es.js          # Spanish
│       │   ├── pt.js          # Portuguese
│       │   ├── fr.js          # French
│       │   ├── ru.js          # Russian
│       │   ├── id.js          # Indonesian
│       │   └── ja.js          # Japanese
├── .docker/
│   ├── Dockerfile-nginx-16-alpine   # Production image
│   ├── Dockerfile-node-16-alpine    # Dev image (http-server)
│   ├── nginx.conf                   # SPA nginx config (all routes → index.html)
│   └── bin/
│       ├── build   # docker build script
│       └── run     # docker run script (port 8080)
├── .skaffold/
│   ├── skaffold.yaml               # Skaffold config (local + node profiles)
│   ├── manifests/k8s-local-dev.yaml
│   └── bin/                        # Skaffold helper scripts
└── .minikube/                      # Minikube configuration
```

## Key Locations by Task

### Adding a new service
1. Create `js/service/MyService.js` as a plain class with constructor dependencies
2. Register it in `js/config/contexts.js` under the appropriate CDI context
3. Inject via constructor in `Application.js` or other services

### Adding a new i18n language
1. Create `js/vue/i18n/XX.js` (ISO 639-1 code) following the structure of `en.js`
2. Register it in `js/vue/i18n/messages.js`
3. Add locale option to the language selector in `index.html`

### Adding new UI components / modals
All Vue templates are inline in `index.html`. Add new modals/sections there.
Vue component data goes in `js/vue/model.js`; methods go in `js/vue/controller.js`.

### Adding new API endpoints
Extend `js/service/Api.js` with new methods. Follow the existing Superagent pattern with status-code-based error handling.

### Adding new configuration
Add to `js/config/config.js` (environment-aware via `window.location.hostname` checks).

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| JS files | kebab-case or PascalCase for classes | `StorageLocal.js`, `urlparam.js` |
| Classes | PascalCase | `StorageLocal`, `Application` |
| Methods/vars | camelCase | `getPlannerData`, `currentYear` |
| CSS files | kebab-case | `yp-dark.css` |
| i18n keys | camelCase dot-notation | `planner.name`, `nav.settings` |
| Storage keys | numeric strings | `"1234567890"` (timestamp-based) |
