# Magpie Gateway for OpenFilm

An independent OpenFilm workbench for adding a model from the Magpie gateway on the same computer. Made with Codex.

## Use

1. Open a project in the OpenFilm desktop app. Add the workbench from the Community or from its folder.
2. Open **Magpie Gateway** and allow the workbench to run in OpenFilm.
3. Enter the Magpie port and the full ID of an image-capable model, then choose **Test and add**.
4. Choose the saved Magpie model in OpenFilm’s chat model menu.

Requires OpenFilm desktop 0.4.1 and a running Magpie gateway. The form starts with port 3425 and an example model ID. Use a model that is available in your own Magpie catalog.

The workbench uses OpenFilm’s custom model settings. Testing sends an included synthetic red image to the loopback gateway, which forwards it to the selected model’s provider. This can use model quota. The workbench does not read project files or provider credentials. The value magpie-openfilm is a local caller label.

## Verification

OpenFilm 0.4.1 recognized the plugin as a workbench. The installed plugin command listed models from a running Magpie gateway and identified the synthetic red image through the Responses API. In a temporary profile, OpenFilm’s model roster saved the selected model after a successful image probe, and a second add kept one model entry.

[MIT license](LICENSE)
