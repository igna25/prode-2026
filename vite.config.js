import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.js",
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/icon.svg"],
      manifest: {
        name: "Prode Mundialista 2026",
        short_name: "Prode 2026",
        start_url: "/",
        display: "standalone",
        background_color: "#0a1128",
        theme_color: "#0a1128",
        orientation: "portrait",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  test: {
    environment: "node",
    globals: true
  }
});
