import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const mockInventory = [
  {
    inventory_type: 'OOH',
    location_emirate: 'Dubai',
    location_data: {
      address: 'Sheikh Zayed Road, Near Burj Khalifa',
      coordinates: { lat: 25.1972, lng: 55.2744 },
      format: 'Digital Billboard',
      dimensions: '14m x 4m'
    },
    audience_metrics: {
      daily_impressions: 450000,
      demographics: {
        age_groups: ['25-44'],
        income_level: 'High',
        nationality_mix: 'Global'
      }
    },
    base_price_aed: 5000.00,
    is_available: true
  },
  {
    inventory_type: 'DOOH',
    location_emirate: 'Abu Dhabi',
    location_data: {
      address: 'Yas Mall Main Atrium',
      coordinates: { lat: 24.4882, lng: 54.6082 },
      format: 'Digital Screen Network',
      dimensions: '2m x 1m (10 Screens)'
    },
    audience_metrics: {
      daily_impressions: 120000,
      demographics: {
        age_groups: ['18-35', '35-50'],
        income_level: 'Medium-High',
        nationality_mix: 'GCC & Expats'
      }
    },
    base_price_aed: 2500.00,
    is_available: true
  },
  {
    inventory_type: 'streaming_video',
    location_emirate: 'Dubai',
    location_data: {
      platform: 'Premium OTT Network UAE',
      placement: 'Pre-roll',
      format: 'Video 15s/30s'
    },
    audience_metrics: {
      daily_impressions: 50000,
      demographics: {
        age_groups: ['18-34'],
        interests: ['Entertainment', 'Sports', 'Tech']
      }
    },
    base_price_aed: 150.00, // CPM
    is_available: true
  },
  {
    inventory_type: 'app',
    location_emirate: 'Dubai',
    location_data: {
      app_name: 'Dubai Metro Guide',
      placement: 'Interstitial',
      format: 'Full Screen'
    },
    audience_metrics: {
      daily_impressions: 85000,
      demographics: {
        age_groups: ['20-50'],
        commuters: true
      }
    },
    base_price_aed: 45.00, // CPM
    is_available: true
  }
];

async function seed() {
  console.log('Starting seed process...');

  // 1. Create a mock publisher user
  const publisherEmail = `publisher_${Date.now()}@elevenads.ae`;
  const publisherPassword = 'password123';
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: publisherEmail,
    password: publisherPassword,
    email_confirm: true,
    user_metadata: {
      role: 'premium_publisher',
      business_name: 'ElevenAds Media Network'
    }
  });

  if (authError) {
    console.error('Error creating publisher:', authError);
    return;
  }

  const userId = authData.user.id;

  // 2. Create publisher profile
  const { error: profileError } = await supabase
    .from('premium_users')
    .insert({
      id: userId,
      email: publisherEmail,
      role: 'premium_publisher',
      business_name: 'ElevenAds Media Network',
      trade_license: 'TL-2024-9999',
      media_license: 'ML-2024-8888',
      verification_status: 'verified'
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    return;
  }

  console.log(`Created publisher: ${publisherEmail}`);

  // 3. Insert Inventory
  const inventoryWithOwner = mockInventory.map(item => ({
    ...item,
    owner_id: userId,
    id: uuidv4() // Generate UUID locally to link with pricing
  }));

  const { error: inventoryError } = await supabase
    .from('premium_inventory')
    .insert(inventoryWithOwner);

  if (inventoryError) {
    console.error('Error inserting inventory:', inventoryError);
    return;
  }

  console.log(`Inserted ${inventoryWithOwner.length} inventory items.`);

  // 4. Insert Dynamic Pricing Data
  const pricingData = inventoryWithOwner.map(item => ({
    inventory_id: item.id,
    demand_multiplier: 1.1, // Slight demand
    time_multiplier: 1.0,
    availability_multiplier: 1.0,
    final_price_aed: item.base_price_aed * 1.1,
    pricing_factors: {
      seasonality: 'High',
      event_proximity: 'None'
    }
  }));

  const { error: pricingError } = await supabase
    .from('dynamic_pricing')
    .insert(pricingData);

  if (pricingError) {
    console.error('Error inserting pricing:', pricingError);
    return;
  }

  console.log('Seed completed successfully!');
}

seed().catch(console.error);
