import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        process.env[key] = val;
      }
    }
  }
}

const targetEmail = 'alinoordot1@gmail.com';
const newPassword = process.argv[2] || 'Ali7787';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function updatePassword() {
  console.log(`🔍 Updating password for ${targetEmail}...`);

  // 1. Get user id
  const usersRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  const usersData = await usersRes.json();
  const user = (usersData.users || []).find(
    (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
  );

  if (!user) {
    console.error(`❌ User not found: ${targetEmail}`);
    process.exit(1);
  }

  // 2. Update user password and confirm email
  const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      password: newPassword,
      email_confirm: true,
    }),
  });

  if (!updateRes.ok) {
    const err = await updateRes.text();
    console.error('❌ Update failed:', err);
    process.exit(1);
  }

  // 3. Ensure role is admin in profiles table
  await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'admin',
      status: 'active',
      updated_at: new Date().toISOString(),
    }),
  });

  console.log(`✅ SUCCESS: Password for ${targetEmail} has been updated to "${newPassword}"!`);
}

updatePassword();
