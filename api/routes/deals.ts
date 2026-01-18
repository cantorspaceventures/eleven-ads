import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

// Validation schema for starting a negotiation
const negotiationSchema = z.object({
  inventory_id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  buyer_offer_aed: z.number().positive(),
  notes: z.string().optional(),
});

/**
 * Start a PMP Negotiation
 * POST /api/deals/negotiate
 */
router.post('/negotiate', async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validate request
    const validatedData = negotiationSchema.parse(req.body);

    // 2. Insert into pmp_negotiations table
    const { data, error } = await supabaseAdmin
      .from('pmp_negotiations')
      .insert({
        inventory_id: validatedData.inventory_id,
        buyer_id: validatedData.buyer_id,
        seller_id: validatedData.seller_id,
        buyer_offer_aed: validatedData.buyer_offer_aed,
        status: 'active',
        negotiation_history: [{
          action: 'offer_created',
          by: 'buyer',
          amount: validatedData.buyer_offer_aed,
          note: validatedData.notes,
          timestamp: new Date().toISOString()
        }]
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Negotiation started successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      });
      return;
    }
    
    console.error('Negotiation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start negotiation',
    });
  }
});

/**
 * Get user's negotiations
 * GET /api/deals/my-deals/:userId
 */
router.get('/my-deals/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('pmp_negotiations')
      .select(`
        *,
        premium_inventory (
          location_data,
          inventory_type
        ),
        premium_users:seller_id (
          business_name
        )
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Fetch deals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deals'
    });
  }
});

/**
 * Update Deal Status (Accept/Reject)
 * PATCH /api/deals/:id/status
 */
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, seller_id } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    // Verify ownership (basic check, ideally middleware handles auth)
    const { data: deal, error: fetchError } = await supabaseAdmin
      .from('pmp_negotiations')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (fetchError || !deal) {
      res.status(404).json({ success: false, error: 'Deal not found' });
      return;
    }

    if (deal.seller_id !== seller_id) {
      res.status(403).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Update status
    const { data, error } = await supabaseAdmin
      .from('pmp_negotiations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: `Deal ${status} successfully`
    });

  } catch (error) {
    console.error('Update deal status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update deal status'
    });
  }
});

export default router;
