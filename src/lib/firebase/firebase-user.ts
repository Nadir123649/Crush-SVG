import "server-only";
import type { Model } from "mongoose";
import type { DecodedIdToken } from "@/lib/firebase/firebase-token";
import { User, type UserDoc, isDuplicateKeyError } from "@/lib/database/db";
import { isAdminEmail } from "@/lib/auth/roles";
export type ProviderName = "google" | "password";
export function providerIdToName(providerId: string): ProviderName {
    switch (providerId) {
        case "google.com":
            return "google";
        case "password":
            return "password";
        default:
            return providerId as ProviderName;
    }
}
function roleFor(email: string | null | undefined): "user" | "admin" {
    return isAdminEmail(email) ? "admin" : "user";
}
export async function resolveUserCascade(token: DecodedIdToken, provider: ProviderName, users?: Model<UserDoc>): Promise<UserDoc> {
    const model = users ?? User;
    const now = new Date();
    const email = token.email ? token.email.toLowerCase().trim() : null;
    let user = await model.findOne({ uid: token.uid });
    
    // If not found by UID, but email exists, link the accounts
    if (!user && email) {
        user = await model.findOne({ email });
        if (user) {
            // Link the new UID if the existing user didn't have one (or had a different one)
            // But usually we don't overwrite UIDs if they have a password-only account,
            // we just add the provider. Actually, we should set the UID to the Google UID 
            // if it was empty, or just let them keep their old one.
            if (!user.uid || user.uid.length === 0) {
                await model.updateOne({ _id: user._id }, { $set: { uid: token.uid } });
            }
        }
    }

    if (user) {
        const expectedRole = roleFor(email);
        const updateData: any = {
            email: email ?? user.email,
            displayName: token.name ?? user.displayName,
            photoURL: token.picture ?? user.photoURL,
            lastLoginAt: now,
        };
        if (token.email_verified) {
            updateData.isVerified = true;
        }
        if (expectedRole === "admin" && user.role !== "admin") {
            updateData.role = "admin";
        }

        return ((await model.findOneAndUpdate({ _id: user._id }, {
            $set: updateData,
            $addToSet: { providers: provider, linkedProviders: provider },
        }, { new: true })) ?? user);
    }
    try {
        return await model.create({
            uid: token.uid,
            email: email ?? token.email ?? null,
            displayName: token.name ?? "CrushSVG user",
            photoURL: token.picture ?? null,
            providers: [provider],
            linkedProviders: [provider],
            role: roleFor(email),
            isVerified: token.email_verified ?? false,
            conversionsUsed: 0,
            lastLoginAt: now,
        });
    }
    catch (error) {
        if (isDuplicateKeyError(error)) {
            const existing = await model.findOne({ uid: token.uid });
            if (existing)
                return existing;
        }
        throw error;
    }
}
