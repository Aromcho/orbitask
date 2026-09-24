import { Matches } from 'class-validator';

/** Valida fechas con formato 'YYYY-MM-DD'. */
export const IsDay = () =>
  Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '$property debe tener formato YYYY-MM-DD' });

/** Valida meses con formato 'YYYY-MM'. */
export const IsMonth = () =>
  Matches(/^\d{4}-\d{2}$/, { message: '$property debe tener formato YYYY-MM' });
