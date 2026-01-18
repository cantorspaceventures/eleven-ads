import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

const createInventorySchema = z.object({
  owner_id: z.string().uuid(),
  inventory_type: z.enum(['OOH', 'DOOH', 'streaming_radio', 'streaming_video', 'app', 'web']),
  location_emirate: z.string(),
  address: z.string(),
  format: z.string(),
  dimensions: z.string().optional(),
  daily_impressions: z.number().positive(),
  base_price_aed: z.number().positive(),
  // New Digital Media Fields (Optional)
  station_format: z.string().optional(),
  listener_demographics: z.any().optional(),
  video_quality: z.string().optional(),
  ad_skippable: z.boolean().optional(),
  mau: z.number().optional(),
  bounce_rate: z.number().optional(),
  website_category: z.string().optional(),
  app_category: z.string().optional(),
});

/**
 * Create new inventory
 * POST /api/inventory
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createInventorySchema.parse(req.body);

    // 1. Create Inventory Record
    const { data: inventory, error: invError } = await supabaseAdmin
      .from('premium_inventory')
      .insert({
        owner_id: validatedData.owner_id,
        inventory_type: validatedData.inventory_type,
        location_emirate: validatedData.location_emirate,
        location_data: {
          address: validatedData.address,
          format: validatedData.format,
          dimensions: validatedData.dimensions,
          // Extended Metadata
          station_format: validatedData.station_format,
          video_quality: validatedData.video_quality,
          ad_skippable: validatedData.ad_skippable,
          website_category: validatedData.website_category,
          app_category: validatedData.app_category,
        },
        audience_metrics: {
          daily_impressions: validatedData.daily_impressions,
          demographics: validatedData.listener_demographics || { type: 'General' },
          mau: validatedData.mau,
          bounce_rate: validatedData.bounce_rate,
        },
        base_price_aed: validatedData.base_price_aed,
        is_available: true
      })
      .select()
      .single();

    if (invError) throw invError;

    // 2. Create Default Dynamic Pricing Record
    const { error: pricingError } = await supabaseAdmin
      .from('dynamic_pricing')
      .insert({
        inventory_id: inventory.id,
        demand_multiplier: 1.0,
        time_multiplier: 1.0,
        availability_multiplier: 1.0,
        final_price_aed: validatedData.base_price_aed,
        pricing_factors: { status: 'initial' }
      });

    if (pricingError) {
       // Cleanup if pricing fails
       await supabaseAdmin.from('premium_inventory').delete().eq('id', inventory.id);
       throw pricingError;
    }

    res.status(201).json({
      success: true,
      data: inventory,
      message: 'Inventory listed successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Create inventory error:', error);
    res.status(500).json({ success: false, error: 'Failed to create inventory' });
  }
});

/**
 * Get all available premium inventory
 * GET /api/inventory
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, location } = req.query;
    
    let query = supabaseAdmin
      .from('premium_inventory')
      .select(`
        *,
        premium_users:owner_id (
          business_name
        )
      `)
      .eq('is_available', true);

    if (type) {
      query = query.eq('inventory_type', type);
    }

    if (location) {
      query = query.eq('location_emirate', location);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
    });
  }
});

/**
 * Get single inventory details
 * GET /api/inventory/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('premium_inventory')
      .select(`
        *,
        premium_users:owner_id (
          business_name,
          verification_status
        ),
        dynamic_pricing (
          final_price_aed,
          demand_multiplier,
          time_multiplier,
          availability_multiplier
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      res.status(404).json({
        success: false,
        error: 'Inventory not found',
      });
      return;
    }

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching inventory details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory details',
    });
  }
});

/**
 * Get publisher's inventory
 * GET /api/inventory/publisher/:id
 */
router.get('/publisher/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('premium_inventory')
      .select(`
        *,
        dynamic_pricing (
          final_price_aed
        )
      `)
      .eq('owner_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching publisher inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
    });
  }
});

/**
 * Delete inventory
 * DELETE /api/inventory/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { owner_id } = req.body; // In real app, get from auth middleware

    // Verify ownership
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('premium_inventory')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      res.status(404).json({ success: false, error: 'Inventory not found' });
      return;
    }

    if (item.owner_id !== owner_id) {
      res.status(403).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Delete (cascade should handle related tables if configured, but let's be safe)
    // Assuming DB has ON DELETE CASCADE for dynamic_pricing and other relations
    const { error: deleteError } = await supabaseAdmin
      .from('premium_inventory')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      message: 'Inventory deleted successfully'
    });

  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete inventory'
    });
  }
});

export default router;
