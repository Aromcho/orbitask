import { createObserveModule } from '@nestjs/observe';

// Devuelve el módulo (para app.module.ts) y el "instrument" (para main.ts).
export const { ObserveModule, ObserveInstrument } = createObserveModule();
