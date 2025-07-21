import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  presetWebFonts,
  transformerDirectives,
} from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons(),
    presetAttributify(),
    presetWebFonts({
      fonts: {
        outfit: "Outfit",
      },
    }),
  ],
  transformers: [transformerDirectives()],
  rules: [["field-content", { "field-sizing": "content" }]],
});
