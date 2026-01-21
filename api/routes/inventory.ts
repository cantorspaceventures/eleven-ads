import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

const createInventorySchema = z.object({
  owner_id: z.string().uuid(),
  inventory_type: z.enum(['OOH', 'DOOH', 'streaming_radio', 'streaming_video', 'app', 'web']),
  location_emirate: z.string(),
  placement_name: z.string().min(1, 'Placement name is required'), // Custom name for the listing
  address: z.string(), // Placement type (dropdown selection)
  format: z.string(),
  dimensions: z.string().optional(),
  daily_impressions: z.number().positive(),
  base_price_aed: z.number().nonnegative(), // Changed to nonnegative for digital inventory (can be 0 if only using CPM)
  image_url: z.string().url().optional().or(z.literal('')),
  // CPM Pricing for digital inventory
  min_spend_aed: z.number().nonnegative().optional(),
  cost_per_impression_aed: z.number().nonnegative().optional(),
  // Context-specific identifiers
  physical_address: z.string().optional(),
  app_name: z.string().optional(),
  website_url: z.string().optional(),
  platform_name: z.string().optional(),
  // Digital Media Fields (Optional)
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
    const isDigitalInventory = ['streaming_radio', 'streaming_video', 'app', 'web'].includes(validatedData.inventory_type);
    
    const inventoryInsert: any = {
      owner_id: validatedData.owner_id,
      inventory_type: validatedData.inventory_type,
      location_emirate: validatedData.location_emirate,
      location_data: {
        placement_name: validatedData.placement_name, // Custom listing name (shown in header)
        address: validatedData.address, // Placement type (dropdown selection)
        format: validatedData.format,
        dimensions: validatedData.dimensions,
        // Context-specific identifiers
        physical_address: validatedData.physical_address,
        app_name: validatedData.app_name,
        website_url: validatedData.website_url,
        platform_name: validatedData.platform_name,
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
      base_price_aed: validatedData.base_price_aed || validatedData.min_spend_aed || 0,
      image_url: validatedData.image_url || null,
      is_available: true
    };

    // Add CPM pricing fields for digital inventory
    if (isDigitalInventory) {
      if (validatedData.min_spend_aed) inventoryInsert.min_spend_aed = validatedData.min_spend_aed;
      if (validatedData.cost_per_impression_aed) inventoryInsert.cost_per_impression_aed = validatedData.cost_per_impression_aed;
    }

    const { data: inventory, error: invError } = await supabaseAdmin
      .from('premium_inventory')
      .insert(inventoryInsert)
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
 * Update inventory and dynamic pricing
 * PUT /api/inventory/:id
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      owner_id,
      // Basic info fields
      placement_name,
      image_url,
      // Metrics
      base_price_aed,
      daily_impressions,
      dimensions,
      mau,
      bounce_rate,
      demand_multiplier,
      time_multiplier,
      final_price_aed,
      // CPM pricing fields
      min_spend_aed,
      cost_per_impression_aed,
    } = req.body;

    // Verify ownership
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('premium_inventory')
      .select('owner_id, inventory_type, location_data, audience_metrics, base_price_aed, min_spend_aed, cost_per_impression_aed, image_url')
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

    // Update inventory
    const updatedLocationData = {
      ...item.location_data,
      placement_name: placement_name !== undefined ? placement_name : item.location_data.placement_name,
      dimensions: dimensions || item.location_data.dimensions,
    };

    const updatedAudienceMetrics = {
      ...item.audience_metrics,
      daily_impressions: daily_impressions ?? item.audience_metrics.daily_impressions,
      mau: mau ?? item.audience_metrics.mau,
      bounce_rate: bounce_rate ?? item.audience_metrics.bounce_rate,
    };

    // Build update object
    const updateData: any = {
      base_price_aed: base_price_aed ?? item.base_price_aed,
      location_data: updatedLocationData,
      audience_metrics: updatedAudienceMetrics,
      updated_at: new Date().toISOString(),
    };

    // Update image URL if provided
    if (image_url !== undefined) {
      updateData.image_url = image_url;
    }

    // Handle CPM pricing fields for digital inventory
    const isDigitalInventory = ['streaming_radio', 'streaming_video', 'app', 'web'].includes(item.inventory_type);
    if (isDigitalInventory) {
      if (min_spend_aed !== undefined) updateData.min_spend_aed = min_spend_aed;
      if (cost_per_impression_aed !== undefined) updateData.cost_per_impression_aed = cost_per_impression_aed;
    }

    const { data: updatedInventory, error: updateError } = await supabaseAdmin
      .from('premium_inventory')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update dynamic pricing
    if (demand_multiplier !== undefined || time_multiplier !== undefined) {
      const { error: pricingError } = await supabaseAdmin
        .from('dynamic_pricing')
        .update({
          demand_multiplier: demand_multiplier ?? 1,
          time_multiplier: time_multiplier ?? 1,
          final_price_aed: final_price_aed ?? base_price_aed,
          calculated_at: new Date().toISOString(),
        })
        .eq('inventory_id', id);

      if (pricingError) throw pricingError;
    }

    res.json({
      success: true,
      data: updatedInventory,
      message: 'Inventory updated successfully'
    });

  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update inventory'
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

/**
 * Toggle inventory availability
 * PATCH /api/inventory/:id/availability
 */
router.patch('/:id/availability', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { owner_id, is_available } = req.body;

    // Verify ownership
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('premium_inventory')
      .select('owner_id, is_available')
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

    // Update availability
    const newAvailability = typeof is_available === 'boolean' ? is_available : !item.is_available;
    
    const { data, error: updateError } = await supabaseAdmin
      .from('premium_inventory')
      .update({ is_available: newAvailability })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      data,
      message: `Inventory ${newAvailability ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update inventory availability'
    });
  }
});

/**
 * Get inventory buyer access rules
 * GET /api/inventory/:id/rules
 */
router.get('/:id/rules', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('inventory_rules')
      .select('*')
      .eq('inventory_id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    // Return default rules if none exist
    const defaultRules = {
      inventory_id: id,
      access_mode: 'open',
      whitelisted_buyers: [],
      blacklisted_buyers: [],
      deal_approval: {
        autoApprove: false,
        autoApproveConditions: {
          meetsFloorPrice: true,
          passesBrandSafety: true,
          buyerVerified: true,
        },
        manualReviewFor: {
          dealsAboveThreshold: true,
          thresholdAmount: 10000,
          sensitiveContent: true,
          firstTimeBuyers: true,
        },
      },
      prohibited_categories: [],
      brand_safety_level: 'standard',
      additional_restrictions: '',
    };

    res.json({
      success: true,
      data: data || defaultRules,
    });
  } catch (error: any) {
    console.error('Error fetching inventory rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory rules',
    });
  }
});

/**
 * Update/Create inventory buyer access rules
 * PUT /api/inventory/:id/rules
 */
router.put('/:id/rules', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      owner_id,
      access_mode,
      whitelisted_buyers,
      blacklisted_buyers,
      deal_approval,
      prohibited_categories,
      brand_safety_level,
      additional_restrictions
    } = req.body;

    // Verify ownership
    const { data: inventory, error: fetchError } = await supabaseAdmin
      .from('premium_inventory')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (fetchError || !inventory) {
      res.status(404).json({ success: false, error: 'Inventory not found' });
      return;
    }

    if (inventory.owner_id !== owner_id) {
      res.status(403).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Upsert rules (insert or update)
    const { data, error } = await supabaseAdmin
      .from('inventory_rules')
      .upsert({
        inventory_id: id,
        access_mode: access_mode || 'open',
        whitelisted_buyers: whitelisted_buyers || [],
        blacklisted_buyers: blacklisted_buyers || [],
        deal_approval: deal_approval || {},
        prohibited_categories: prohibited_categories || [],
        brand_safety_level: brand_safety_level || 'standard',
        additional_restrictions: additional_restrictions || '',
      }, {
        onConflict: 'inventory_id'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Inventory rules saved successfully'
    });

  } catch (error: any) {
    console.error('Error saving inventory rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save inventory rules'
    });
  }
});

/**
 * Get inventory availability settings
 * GET /api/inventory/:id/availability-settings
 */
router.get('/:id/availability-settings', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('inventory_availability_settings')
      .select('*')
      .eq('inventory_id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    // Return default settings if none exist
    const defaultSettings = {
      inventory_id: id,
      commitment_level: 'guaranteed',
      min_booking_lead_time: '24_hours',
      campaign_approval_sla: '4_business_hours',
      block_out_periods: [],
    };

    res.json({
      success: true,
      data: data || defaultSettings,
    });
  } catch (error: any) {
    console.error('Error fetching availability settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability settings',
    });
  }
});

/**
 * Update/Create inventory availability settings
 * PUT /api/inventory/:id/availability-settings
 */
router.put('/:id/availability-settings', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      owner_id,
      commitment_level,
      min_booking_lead_time,
      campaign_approval_sla,
      block_out_periods
    } = req.body;

    // Verify ownership
    const { data: inventory, error: fetchError } = await supabaseAdmin
      .from('premium_inventory')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (fetchError || !inventory) {
      res.status(404).json({ success: false, error: 'Inventory not found' });
      return;
    }

    if (inventory.owner_id !== owner_id) {
      res.status(403).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Upsert availability settings (insert or update)
    const { data, error } = await supabaseAdmin
      .from('inventory_availability_settings')
      .upsert({
        inventory_id: id,
        commitment_level: commitment_level || 'guaranteed',
        min_booking_lead_time: min_booking_lead_time || '24_hours',
        campaign_approval_sla: campaign_approval_sla || '4_business_hours',
        block_out_periods: block_out_periods || [],
      }, {
        onConflict: 'inventory_id'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Availability settings saved successfully'
    });

  } catch (error: any) {
    console.error('Error saving availability settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save availability settings'
    });
  }
});

export default router;
