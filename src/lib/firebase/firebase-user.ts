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
    const byUid = await model.findOne({ uid: token.uid });
    if (byUid) {
        const expectedRole = roleFor(email);
        const updateData: any = {
            email: email ?? byUid.email,
            displayName: token.name ?? byUid.displayName,
            photoURL: token.picture ?? byUid.photoURL,
            lastLoginAt: now,
        };
        if (expectedRole === "admin" && byUid.role !== "admin") {
            updateData.role = "admin";
        }

        return ((await model.findOneAndUpdate({ uid: token.uid }, {
            $set: updateData,
            $addToSet: { providers: provider, linkedProviders: provider },
        }, { new: true })) ?? byUid);
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
