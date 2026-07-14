import { Schema, model } from 'mongoose';

export const SITE_CONTENT_SINGLETON_ID = 'site-content';

const siteContentSchema = new Schema(
  {
    _id: { type: String, default: SITE_CONTENT_SINGLETON_ID },
    mascotUrl: { type: String, required: true },
    heroBgUrl: { type: String, required: true },
    mascotWaveUrl: { type: String, required: true },
    mapUrl: { type: String, required: true },
    aboutInteriorUrl: { type: String, required: true },
    baristaPourUrl: { type: String, required: true },
    roastBeansUrl: { type: String, required: true },
    mistyForestUrl: { type: String, required: true },
    instagramPhotos: { type: [String], default: [] },
    contact: {
      address: { type: String, required: true },
      hours: { type: String, required: true },
      kitchenNote: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret['_id'] = undefined;
        ret['__v'] = undefined;
        return ret;
      }
    }
  }
);

export const SiteContent = model('SiteContent', siteContentSchema);
