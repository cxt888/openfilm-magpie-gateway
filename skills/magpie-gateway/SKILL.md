---
name: magpie-gateway
description: Connect OpenFilm’s desktop agent to the local Magpie gateway, list available model IDs, and check image input.
---

The Magpie Gateway workbench adds a model to OpenFilm’s desktop agent menu via its own-key model configuration. Use the model ID exactly as Magpie lists it. Magpie must be running on this computer.

This independent workbench was made with Codex. The included `red-test.png` is a generated test tile.

- `openfilm magpie-gateway models` lists the live catalog. Add `--json` for model IDs and input modalities.
- `openfilm magpie-gateway check <model-id>` sends a generated 16 × 16 red image and checks the answer. This makes one model request and may consume the model’s quota.
- Both accept `--port <port>`. Without it, the commands read Magpie’s port setting and default to `3425`.

Use the desktop workbench to add the model or open Settings → Agents to manage an added model. Only run the image test when troubleshooting the connection as requested. Use a model that accepts image input, since OpenFilm’s agent inspects frames. Magpie covers the model used in chat. The project’s media services are configured in OpenFilm’s Services settings.
