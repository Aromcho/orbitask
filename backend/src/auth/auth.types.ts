import type { Request } from 'express';

export const AUTH_COOKIE = 'orbitask_token';

/** Lo que guardamos dentro del JWT. */
export interface JwtPayload {
  sub: string; // id del usuario
  email: string;
}

/** Request de Express con el usuario que agrega el AuthGuard. */
export type AuthRequest = Request & { user?: JwtPayload };
