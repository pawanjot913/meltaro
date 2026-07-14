import { Schema, model } from 'mongoose';

const newsletterSubscriberSchema = new Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, unique: true }
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

export const NewsletterSubscriber = model('NewsletterSubscriber', newsletterSubscriberSchema);
