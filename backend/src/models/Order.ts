import { Schema, model } from 'mongoose';

export const ORDER_MODES = ['pickup', 'delivery', 'carhop'] as const;
export const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'] as const;

const orderItemSchema = new Schema(
  {
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    vehicleLicense: { type: String },
    mode: { type: String, enum: ORDER_MODES, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    // Supabase Auth user who placed the order (set by requireCustomer)
    userId: { type: String, index: true },
    userEmail: { type: String, trim: true },
    items: { type: [orderItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    fee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret['orderId'] = String(ret['_id']);
        ret['createdAt'] = ret['createdAt'] instanceof Date
          ? (ret['createdAt'] as Date).toISOString()
          : ret['createdAt'];
        ret['_id'] = undefined;
        ret['__v'] = undefined;
        return ret;
      }
    }
  }
);

orderSchema.index({ createdAt: -1 });

export const Order = model('Order', orderSchema);
