---
version: 1
dynamic_routing:
  enabled: false
models:
  research: openai-codex/gpt-5.3-codex
  planning: openai-codex/gpt-5.3-codex
  discuss: openai-codex/gpt-5.3-codex
  execution: openai-codex/gpt-5.3-codex
  execution_simple: openai-codex/gpt-5.3-codex
  completion: openai-codex/gpt-5.3-codex
  validation: openai-codex/gpt-5.3-codex
  subagent: openai-codex/gpt-5.3-codex
---

# Project GSD Preferences

Pin auto-mode routing to a ChatGPT-account-compatible Codex model for all phases.
Dynamic routing is disabled to prevent capability-scored selection of unsupported models (e.g. `gpt-5.1-codex-max`).
