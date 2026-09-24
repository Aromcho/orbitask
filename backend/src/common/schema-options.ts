import type { SchemaOptions } from 'mongoose';

// Opciones compartidas por todos los schemas:
// - createdAt / updatedAt automáticos
// - al serializar a JSON se expone `id` (string) en lugar de `_id` y se quita `__v`
export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret._id;
      return ret;
    },
  },
};
