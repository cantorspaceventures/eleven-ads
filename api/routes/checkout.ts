import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

const checkoutSchema = z.object({
  inventory_id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  total_price: z.number().positive(),
  start_date: z.string(),
  end_date: z.string(),
});

/**
 * Programmatic Guaranteed Checkout
 * POST /api/deals/checkout
 */
router.post('/checkout', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = checkoutSchema.parse(req.body);

    // 1. Create a "Preferred Deal" record (acts as the contract)
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('preferred_deals')
      .insert({
        inventory_id: validatedData.inventory_id,
        buyer_id: validatedData.buyer_id,
        seller_id: validatedData.seller_id,
        agreed_price_aed: validatedData.total_price,
        volume_commitment: 100000, // Placeholder volume
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        status: 'active' // Auto-active for Instant Buy
      })
      .select()
      .single();

    if (dealError) throw dealError;

    // 2. Create the "Programmatic Guaranteed" execution record
    const { error: pgError } = await supabaseAdmin
      .from('programmatic_guaranteed')
      .insert({
        preferred_deal_id: deal.id,
        guaranteed_impressions: 100000,
        total_value_aed: validatedData.total_price,
        guarantee_terms: {
          cancellation: 'Non-cancellable',
          payment: 'Immediate'
        },
        is_fulfilled: false
      });

    if (pgError) {
      // Rollback deal if PG creation fails
      await supabaseAdmin.from('preferred_deals').delete().eq('id', deal.id);
      throw pgError;
    }

    res.status(201).json({
      success: true,
      data: deal,
      message: 'Booking confirmed successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, error: 'Checkout failed' });
  }
});

export default router;
