import { Router, type Request, type Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

/**
 * Get AI Pricing Explanation
 * GET /api/ai/explain/:inventoryId
 */
router.get('/explain/:inventoryId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { inventoryId } = req.params;

    // Fetch inventory + pricing data
    const { data: inventory, error: invError } = await supabaseAdmin
      .from('premium_inventory')
      .select(`
        *,
        dynamic_pricing (*)
      `)
      .eq('id', inventoryId)
      .single();

    if (invError || !inventory) {
      res.status(404).json({ success: false, error: 'Inventory not found' });
      return;
    }

    const pricing = inventory.dynamic_pricing?.[0];
    
    // In a real system, this would call a Python ML service.
    // Here we simulate the AI explanation based on the multipliers.
    
    const explanation = {
      base_price: inventory.base_price_aed,
      final_price: pricing?.final_price_aed || inventory.base_price_aed,
      confidence_score: 0.94,
      factors: [
        {
          name: 'Seasonality',
          impact: 'High',
          description: 'Peak tourist season in UAE increases demand for OOH.',
          score: 85
        },
        {
          name: 'Location Demand',
          impact: 'Medium',
          description: `High footfall area in ${inventory.location_emirate}.`,
          score: 65
        },
        {
          name: 'Time of Day',
          impact: 'Neutral',
          description: 'Standard rotation schedule.',
          score: 50
        }
      ],
      market_trends: {
        trend: 'up',
        percentage: 12,
        context: 'Sector-wide price increase for premium assets.'
      },
      ai_reasoning: `The price is set at a premium due to high seasonal demand in ${inventory.location_emirate} and limited availability of premium ${inventory.inventory_type} inventory. Our model predicts a further 5% increase in the next 7 days.`
    };

    res.json({
      success: true,
      data: explanation
    });

  } catch (error) {
    console.error('AI explanation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate explanation'
    });
  }
});

export default router;
