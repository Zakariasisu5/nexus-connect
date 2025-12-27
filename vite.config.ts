import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // Keep the componentTagger disabled by default in development to avoid slowing dev startup.
  // Enable it by setting LOVABLE_TAGGER=true in your environment if you need it.
  plugins: [
    react(),
    mode === "development" && process.env.LOVABLE_TAGGER === 'true' && componentTagger(),
  ].filter(Boolean),
  optimizeDeps: {
    include: ['framer-motion', 'lucide-react', '@supabase/supabase-js'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
