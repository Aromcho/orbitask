import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca un endpoint como público (el AuthGuard global lo deja pasar sin sesión). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
