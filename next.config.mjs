import path from 'path'
import { fileURLToPath } from 'url'

// Resolve the absolute directory of this config file in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Normalize Windows paths to POSIX-style for Next.js configuration
const ROOT_DIR = path.resolve(__dirname).replace(/\\/g, '/')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable Next.js Dev Tools UI for this project
  devIndicators: false,
  // Explicitly set the Turbopack root so Next.js resolves from the project root
  // Fixes: "Next.js inferred your workspace root, but it may not be correct"
  turbopack: {
    root: ROOT_DIR,
  },
}

export default nextConfig
