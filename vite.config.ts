import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "prompt",

            devOptions: {
                enabled: true,
            },
            manifest: {
                short_name: "Klugscheißer-Quiz",
                name: "Klugscheiißer Quiz",
                icons: [
                    {
                        src: "/icons/maskable_icon.png",
                        type: "image/png",
                        sizes: "301x301",
                        purpose: "any",
                    },
                    {
                        src: "/icons/maskable_icon.png",
                        type: "image/png",
                        sizes: "301x301",
                        purpose: "maskable",
                    },
                ],
                start_url: "/",
                id: "0.0.1",
                background_color: "#022249",
                theme_color: "#022249",
                display: "fullscreen",
            },
        }),
    ],
});
