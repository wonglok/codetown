import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
	server: {
		open: true,
	},
	plugins: [
		//
		react(),
		tailwindcss(),
	],
});
