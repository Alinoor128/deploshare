import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local manually
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

const targetEmail = process.argv[2] || 'alinoordot1@gmail.com';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

async function promote() {
  console.log(`🔍 Searching for user ${targetEmail} via Supabase Admin API...`);

  // 1. Fetch user list via Supabase Auth Admin REST API
  const usersRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!usersRes.ok) {
    const err = await usersRes.text();
    console.error('❌ Auth API error:', err);
    process.exit(1);
  }

  const usersData = await usersRes.json();
  const user = (usersData.users || []).find(
    (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
  );

  if (!user) {
    console.error(`❌ User with email ${targetEmail} not found in Supabase Auth.`);
    console.log('Available users:', (usersData.users || []).map((u) => u.email));
    process.exit(1);
  }

  console.log(`✓ Found user ID: ${user.id}`);

  // 2. Update role in public.profiles table via PostgREST
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      role: 'admin',
      status: 'active',
      updated_at: new Date().toISOString(),
    }),
  });

  if (!profileRes.ok) {
    const err = await profileRes.text();
    console.error('❌ Profiles update error:', err);
    process.exit(1);
  }

  const updatedProfile = await profileRes.json();
  console.log(`🎉 SUCCESS: ${targetEmail} (ID: ${user.id}) is now successfully promoted to ADMIN!`);
  console.log('Updated Profile:', updatedProfile);
}

promote();
