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

async function seedInventory() {
  console.log('🌱 Seeding Inventory Data...');

  // 1. Get a Publisher User (or create one if needed)
  // For simplicity, we'll try to find the one we seeded earlier, or just pick the first publisher
  let { data: publisher, error: userError } = await supabase
    .from('premium_users')
    .select('id')
    .eq('role', 'premium_publisher')
    .limit(1)
    .single();

  if (userError || !publisher) {
    console.log('No publisher found. Creating a temporary seed publisher...');
    // Create auth user first (simplified for seed script - ideally use admin auth API)
    // Here we will just insert into premium_users assuming the auth user exists or we bypass for now
    // Actually, we need a valid UUID that exists in auth.users for RLS usually, 
    // but premium_users is our public profile table.
    
    // Let's try to get ANY user to attach inventory to, or fail.
    const { data: users } = await supabase.from('premium_users').select('id').limit(1);
    if (!users || users.length === 0) {
      console.error('❌ No users found. Please run the user seed script first or register a user.');
      return;
    }
    publisher = users[0];
  }

  const SEED_TAG = 'seed_data_v1';

  const inventoryItems = [
    {
      owner_id: publisher.id,
      inventory_type: 'DOOH',
      location_emirate: 'Dubai',
      location_data: {
        address: 'Sheikh Zayed Road, Near Museum of the Future',
        format: 'Digital Billboard',
        dimensions: '20m x 10m',
        tag: SEED_TAG 
      },
      audience_metrics: {
        daily_impressions: 450000,
        demographics: { type: 'Mixed', income: 'High' }
      },
      base_price_aed: 15000,
      is_available: true
    },
    {
      owner_id: publisher.id,
      inventory_type: 'OOH',
      location_emirate: 'Abu Dhabi',
      location_data: {
        address: 'Corniche Road, West End',
        format: 'Unipole',
        dimensions: '12m x 6m',
        tag: SEED_TAG
      },
      audience_metrics: {
        daily_impressions: 120000,
        demographics: { type: 'Families', income: 'Medium-High' }
      },
      base_price_aed: 8500,
      is_available: true
    },
    {
      owner_id: publisher.id,
      inventory_type: 'app',
      location_emirate: 'Dubai',
      location_data: {
        address: 'Dubai Metro App - Home Screen',
        format: 'Mobile Banner',
        dimensions: '320x50',
        tag: SEED_TAG
      },
      audience_metrics: {
        daily_impressions: 800000,
        demographics: { type: 'Commuters', income: 'Mixed' }
      },
      base_price_aed: 5000,
      is_available: true
    },
    {
      owner_id: publisher.id,
      inventory_type: 'streaming_video',
      location_emirate: 'Dubai',
      location_data: {
        address: 'Premium Sports Streaming Network',
        format: 'Pre-roll Video',
        dimensions: '1080p',
        tag: SEED_TAG
      },
      audience_metrics: {
        daily_impressions: 250000,
        demographics: { type: 'Sports Fans', income: 'Medium' }
      },
      base_price_aed: 12000,
      is_available: true
    }
  ];

  for (const item of inventoryItems) {
    // Insert Inventory
    const { data: insertedInv, error: invError } = await supabase
      .from('premium_inventory')
      .insert(item)
      .select()
      .single();

    if (invError) {
      console.error(`Error inserting ${item.location_data.address}:`, invError.message);
      continue;
    }

    // Insert Pricing
    const { error: priceError } = await supabase
      .from('dynamic_pricing')
      .insert({
        inventory_id: insertedInv.id,
        final_price_aed: item.base_price_aed,
        demand_multiplier: 1.0,
        time_multiplier: 1.0,
        availability_multiplier: 1.0,
        pricing_factors: { status: 'seeded', tag: SEED_TAG }
      });

    if (priceError) {
      console.error(`Error creating pricing for ${insertedInv.id}:`, priceError.message);
    } else {
      console.log(`✅ Seeded: ${item.location_data.address}`);
    }
  }

  console.log('✨ Inventory seeding complete!');
}

seedInventory().catch(console.error);
