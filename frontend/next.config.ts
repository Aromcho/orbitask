import type { NextConfig } from "next";

// URL del backend Nest. En desarrollo corre en el puerto 3001.
const API_URL = process.env.API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // El navegador siempre habla con /api del mismo dominio y Next lo reenvía al backend.
  // Así la cookie de sesión es "first-party" y no hace falta configurar CORS.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
