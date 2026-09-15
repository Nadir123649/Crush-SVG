import mongoose, { Schema, type Document } from 'mongoose'

export interface INewsletterSubscriber extends Document {
  email: string
  subscribedAt: Date
  source: string
  active: boolean
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
  source: {
    type: String,
    default: 'changelog',
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
})

NewsletterSubscriberSchema.index({ email: 1 }, { unique: true })

export const NewsletterSubscriber =
  mongoose.models.NewsletterSubscriber ||
  mongoose.model<INewsletterSubscriber>('NewsletterSubscriber', NewsletterSubscriberSchema)
