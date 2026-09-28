import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

// URL del backend Nest. En desarrollo corre en el puerto 3001.
const API_URL = process.env.API_URL ?? "http://localhost:3001";

// IPs de esta PC en la red local (ej: 192.168.0.17), para abrir el modo desarrollo desde el celu.
const LAN_IPS = Object.values(networkInterfaces())
  .flat()
  .filter((net) => net && net.family === "IPv4" && !net.internal)
  .map((net) => net!.address);

const nextConfig: NextConfig = {
  // El navegador siempre habla con /api del mismo dominio y Next lo reenvía al backend.
  // Así la cookie de sesión es "first-party" y no hace falta configurar CORS.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
  // En desarrollo Next bloquea pedidos que no vengan de localhost. Habilitamos la red
  // local (celu en el mismo Wi-Fi) y Tailscale (https://tu-pc.xxxx.ts.net). Ver docs/05-mobile.md
  allowedDevOrigins: [...LAN_IPS, "**.ts.net"],
};

export default nextConfig;
