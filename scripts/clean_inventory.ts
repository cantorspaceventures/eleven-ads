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

async function cleanSeededData() {
  console.log('🧹 Cleaning up seeded inventory data...');

  const SEED_TAG = 'seed_data_v1';

  // We can't query JSON columns easily with delete in one go in some Supabase versions without extensions,
  // so let's find IDs first.
  
  // Actually, we can just delete from premium_inventory where location_data->>'tag' = SEED_TAG
  // But let's verify if that works with the client directly.
  
  const { data: items, error: fetchError } = await supabase
    .from('premium_inventory')
    .select('id')
    .eq('location_data->>tag', SEED_TAG);

  if (fetchError) {
    console.error('Error fetching seeded items:', fetchError);
    return;
  }

  if (!items || items.length === 0) {
    console.log('No seeded data found to clean.');
    return;
  }

  const ids = items.map(i => i.id);
  console.log(`Found ${ids.length} seeded items. Deleting...`);

  const { error: deleteError } = await supabase
    .from('premium_inventory')
    .delete()
    .in('id', ids);

  if (deleteError) {
    console.error('Error deleting items:', deleteError);
  } else {
    console.log(`✅ Successfully deleted ${ids.length} items.`);
  }
}

cleanSeededData().catch(console.error);
