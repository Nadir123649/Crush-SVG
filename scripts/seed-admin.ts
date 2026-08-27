import 'server-only';
import { loadEnvConfig } from '@next/env';
import crypto from 'crypto';

// Load environment variables for local testing (production env vars are provided by the host)
const projectDir = process.cwd();
loadEnvConfig(projectDir);

// Must import DB and Models after env vars are loaded
import { connectToDatabase } from '../src/lib/database/db';
import { User } from '../src/lib/database/models/user';
import { hashPassword } from '../src/lib/auth/passwords';

async function seedAdmin() {
  try {
    const adminEmailsStr = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmailsStr) {
      console.error('❌ Error: ADMIN_EMAILS (or ADMIN_EMAIL) environment variable is missing.');
      process.exit(1);
    }

    if (!adminPassword) {
      console.error('❌ Error: ADMIN_PASSWORD environment variable is missing.');
      process.exit(1);
    }

    const firstAdminEmail = adminEmailsStr.split(',')[0].trim().toLowerCase();

    console.log(`⏳ Connecting to MongoDB to setup admin: ${firstAdminEmail}...`);
    await connectToDatabase();

    const existingAdmin = await User.findOne({ email: firstAdminEmail });

    if (existingAdmin) {
      console.log('✅ Admin user already exists in the database.');
      let updated = false;

      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        updated = true;
        console.log('   -> Updated role to "admin".');
      }

      if (!existingAdmin.isVerified) {
        existingAdmin.isVerified = true;
        updated = true;
        console.log('   -> Updated isVerified to true.');
      }

      if (updated) {
        await existingAdmin.save();
        console.log('✅ Admin user record updated securely (password unchanged).');
      } else {
        console.log('✅ Admin user record is already correct.');
      }
    } else {
      console.log('⏳ Creating new Admin user...');
      const hashedPassword = await hashPassword(adminPassword);

      await User.create({
        uid: crypto.randomUUID(),
        email: firstAdminEmail,
        displayName: 'Administrator',
        role: 'admin',
        password: hashedPassword,
        isVerified: true,
        lastLoginAt: new Date(),
        conversionsUsed: 0,
        providers: ['email'],
        linkedProviders: ['email'],
      });
      console.log('✅ Admin user created successfully.');
    }
  } catch (error) {
    console.error('❌ Failed to seed admin:', error);
    process.exit(1);
  }
}

seedAdmin().then(() => process.exit(0));
