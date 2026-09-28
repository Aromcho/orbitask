import { type NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "orbitask_token";

/**
 * Chequeo optimista de sesión: si no hay cookie, a /login.
 * La validación real del token la hace el backend en cada request.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(AUTH_COOKIE);
  const isLogin = request.nextUrl.pathname === "/login";

  if (!hasSession && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSession && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Todo menos la API, los assets de Next y los archivos de /public.
  // El manifest y los íconos tienen que quedar afuera: el celu los pide sin la cookie
  // de sesión y, si se los redirige al login, no ofrece instalar la app.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|webmanifest)$).*)"],
};
