import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

const createCampaignSchema = z.object({
  advertiser_id: z.string().uuid(),
  name: z.string().min(3),
  objective: z.enum(['brand_awareness', 'traffic', 'conversions']),
  total_budget: z.number().positive(),
  start_date: z.string(),
  end_date: z.string(),
  // New RTB Fields
  max_cpm_bid: z.number().optional(),
  targeting: z.object({
    locations: z.array(z.string()).optional(),
    demographics: z.any().optional(),
    interests: z.array(z.string()).optional()
  }).optional(),
  creatives: z.array(z.object({
    name: z.string(),
    type: z.enum(['image', 'video', 'html5']),
    url: z.string().url(),
    format: z.string()
  })).min(1)
});

/**
 * Create Campaign with Creatives
 * POST /api/campaigns
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createCampaignSchema.parse(req.body);

    // 1. Create Campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .insert({
        advertiser_id: validatedData.advertiser_id,
        name: validatedData.name,
        objective: validatedData.objective,
        total_budget: validatedData.total_budget,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        // Store RTB data
        max_cpm_bid: validatedData.max_cpm_bid || 0,
        targeting: validatedData.targeting || {},
        status: 'active' // Auto-active for demo
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    // 2. Insert Creatives
    const creativesData = validatedData.creatives.map(creative => ({
      campaign_id: campaign.id,
      ...creative,
      status: 'pending_review'
    }));

    const { error: creativesError } = await supabaseAdmin
      .from('creatives')
      .insert(creativesData);

    if (creativesError) {
      // Rollback campaign
      await supabaseAdmin.from('campaigns').delete().eq('id', campaign.id);
      throw creativesError;
    }

    res.status(201).json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Create campaign error:', error);
    res.status(500).json({ success: false, error: 'Failed to create campaign' });
  }
});

/**
 * Get Advertiser Campaigns
 * GET /api/campaigns/advertiser/:id
 */
router.get('/advertiser/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        creatives (*)
      `)
      .eq('advertiser_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch campaigns' });
  }
});

export default router;
