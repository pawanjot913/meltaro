import { Schema, model } from 'mongoose';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sub: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    order: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret['__v'] = undefined;
        return ret;
      }
    }
  }
);

categorySchema.index({ order: 1 });

export const Category = model('Category', categorySchema);
