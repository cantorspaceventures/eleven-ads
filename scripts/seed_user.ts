import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedUser() {
  console.log('👤 Seeding Test User...');

  const email = 'developer@elevenads.com';
  const password = 'password123';
  const role = 'premium_publisher'; // or premium_advertiser

  // 1. Create Auth User
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role }
  });

  if (authError) {
    console.error('Error creating auth user:', authError.message);
    // If user already exists, try to find them to update/ensure profile exists
    if (authError.message.includes('already registered')) {
        console.log('User already exists. Skipping auth creation.');
        // In a real script we might want to fetch the ID here if we needed it, 
        // but for now we can just tell the user to login.
        return;
    }
    return;
  }

  if (!authUser.user) {
    console.error('Auth user creation returned no data.');
    return;
  }

  console.log(`✅ Auth User Created: ${email}`);

  // 2. Create Public Profile (premium_users)
  const { error: profileError } = await supabase
    .from('premium_users')
    .insert({
      id: authUser.user.id,
      email: email,
      role: role,
      business_name: 'ElevenAds Dev Team',
      trade_license: 'DEV-12345',
      media_license: 'MEDIA-999',
      verification_status: 'verified'
    });

  if (profileError) {
    console.error('Error creating public profile:', profileError.message);
  } else {
    console.log('✅ Public Profile Created');
    console.log(`\n🎉 Login Credentials:\nEmail: ${email}\nPassword: ${password}\n`);
  }
}

seedUser().catch(console.error);
