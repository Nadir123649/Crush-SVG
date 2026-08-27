import mongoose from "mongoose";

try {
    process.loadEnvFile(".env.local");
} catch {
    try {
        process.loadEnvFile(".env");
    } catch {
        // no env file found; rely on process env
    }
}

const ADMIN_EMAILS_RAW = process.env.ADMIN_EMAILS ?? "";
const TARGET_EMAILS = ADMIN_EMAILS_RAW.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

const CHECK_MODE = process.argv.includes("--check");

function fail(message: string, code = 1): never {
    console.error(`[seed:admin] ${message}`);
    process.exit(code);
}

async function main(): Promise<void> {
    if (TARGET_EMAILS.length === 0) {
        fail(
            "ADMIN_EMAILS is missing or empty. Set ADMIN_EMAILS to a comma-separated list of emails to promote (e.g. ADMIN_EMAILS=nadir.novatore@gmail.com)."
        );
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        fail("MONGODB_URI is required to seed the admin account.");
    }

    const dbName = process.env.MONGODB_DB_NAME || "crushsvg";
    const maxPoolSize = Number(process.env.MONGODB_MAX_POOL_SIZE) || 10;

    await mongoose.connect(uri, {
        dbName,
        appName: "crushsvg-seed-admin",
        serverSelectionTimeoutMS: 5000,
        maxPoolSize,
        minPoolSize: 0,
        maxIdleTimeMS: 60000,
    });

    const User = mongoose.model(
        "User",
        new mongoose.Schema(
            {
                email: { type: String },
                role: { type: String, enum: ["user", "admin"] },
            },
            { timestamps: false }
        )
    );

    let hadFailure = false;

    for (const email of TARGET_EMAILS) {
        const user = await User.findOne({ email }).select("_id email role").lean();

        if (!user) {
            hadFailure = true;
            console.error(
                `[seed:admin] No user found for "${email}". Create the account through the normal authentication flow first. Skipping.`
            );
            continue;
        }

        if (user.role === "admin") {
            console.log(
                CHECK_MODE
                    ? `[seed:admin] (check) ${email} currently has role="admin". No write performed.`
                    : `[seed:admin] ${email} is already admin. No change needed.`
            );
            continue;
        }

        if (CHECK_MODE) {
            console.log(`[seed:admin] (check) ${email} currently has role="${user.role}". No write performed.`);
            continue;
        }

        await User.updateOne({ _id: user._id }, { $set: { role: "admin" } });
        console.log(`[seed:admin] Promoted ${email} to role="admin".`);
    }

    if (hadFailure) {
        fail("One or more target emails had no matching user. No users were created or modified for those entries.", 1);
    }
}

main()
    .catch((err) => {
        console.error(`[seed:admin] Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
