/**
 * One-off data repair for the "admin implies verified" rule.
 *
 * Demotes every `role: "admin"` profile that is not verified back to
 * `role: "user"`. Verification follows the same definition used at runtime
 * (`isVerifiedProfile`): `isVerified === true`, or a linked Google provider.
 *
 * Safe to re-run: it only matches rows that are actually invalid.
 *
 *   npm run fix:unverified-admins            # apply
 *   npm run fix:unverified-admins -- --dry   # report only
 */
import { loadEnvConfig } from "@next/env";
import dns from "node:dns";
import mongoose from "mongoose";
import { resolveRole } from "../src/lib/auth/roles";

loadEnvConfig(process.cwd());

async function main() {
    const dryRun = process.argv.includes("--dry");

    const dnsServers = process.env.DNS_SERVERS;
    if (dnsServers) {
        dns.setServers(dnsServers.split(",").map(s => s.trim()));
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI must be set");
    }

    await mongoose.connect(uri, {
        dbName: process.env.MONGODB_DB_NAME || "crushsvg",
        serverSelectionTimeoutMS: 8000,
    });

    const users = mongoose.connection.collection("users");

    // Same predicate as isVerifiedProfile: verified OR Google-linked.
    const verified = {
        $or: [
            { isVerified: true },
            { providers: { $in: ["google", "google.com"] } },
        ],
    };

    const invalid = await users
        .find({ role: "admin", $nor: [verified] })
        .project({ email: 1, role: 1, isVerified: 1, providers: 1 })
        .toArray();

    // Only demote rows the shared runtime helper also considers unverified.
    const targets = invalid.filter(u => resolveRole(u) === "user");

    console.log(`Found ${invalid.length} unverified admin profile(s).`);
    for (const u of targets) {
        console.log(
            `  - ${u.email} (isVerified=${u.isVerified ?? false}, providers=${JSON.stringify(u.providers ?? [])})`,
        );
    }

    if (targets.length === 0) {
        console.log("Nothing to repair.");
        return;
    }

    if (dryRun) {
        console.log("\n--dry: no changes written.");
        return;
    }

    const res = await users.updateMany(
        { _id: { $in: targets.map(u => u._id) } },
        { $set: { role: "user" } },
    );

    console.log(`\nDemoted ${res.modifiedCount} profile(s) to role "user".`);

    // Sanity check: nothing invalid may remain.
    const remaining = await users.countDocuments({ role: "admin", $nor: [verified] });
    console.log(`Remaining unverified admins: ${remaining}`);
    if (remaining > 0) {
        throw new Error("Unverified admin profiles still present after repair");
    }
}

main()
    .catch((err) => {
        console.error("fix-unverified-admins failed:", err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect().catch(() => {});
    });
