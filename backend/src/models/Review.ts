import { Schema, model } from 'mongoose';

const reviewSchema = new Schema(
  {
    quote: { type: String, required: true },
    author: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    avatar: { type: String, required: true },
    isPublished: { type: Boolean, default: true }
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

export const Review = model('Review', reviewSchema);
