import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthRequest } from './auth.types.js';

/** Inyecta en el handler el payload del JWT de la sesión actual. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<AuthRequest>().user,
);
