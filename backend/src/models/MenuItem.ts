import { Schema, model } from 'mongoose';

const menuItemSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    isPopular: { type: Boolean, default: false },
    ingredients: { type: [String], default: [] },
    tags: { type: [String], default: [] }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret['id'] = ret['_id'];
        ret['_id'] = undefined;
        ret['__v'] = undefined;
        return ret;
      }
    }
  }
);

export const MenuItem = model('MenuItem', menuItemSchema);
