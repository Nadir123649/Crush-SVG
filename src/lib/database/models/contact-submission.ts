import mongoose, { Schema, type Document } from "mongoose";

export type ContactDeliveryStatus = "pending" | "sent" | "failed";

export interface ContactSubmissionDoc extends Document {
  name: string;
  email: string;
  message: string;
  deliveryStatus: ContactDeliveryStatus;
  deliveryError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSubmissionSchema = new Schema<ContactSubmissionDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    deliveryStatus: { type: String, enum: ["pending", "sent", "failed"], default: "pending", required: true },
    deliveryError: { type: String, maxlength: 500 },
  },
  { timestamps: true, collection: "contact_submissions" }
);

contactSubmissionSchema.index({ createdAt: -1 });

export const ContactSubmission =
  mongoose.models.ContactSubmission || mongoose.model<ContactSubmissionDoc>("ContactSubmission", contactSubmissionSchema);
