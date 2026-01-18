import { Router, type Request, type Response } from 'express';
import { AuctionEngine } from '../services/AuctionEngine.js';
import type { BidRequest } from '../types/openrtb.js';

const router = Router();

/**
 * OpenRTB 2.6 Bid Request Endpoint
 * POST /api/rtb/bid
 * 
 * Receives a bid request from an SSP/Exchange
 * Returns a bid response with the winning ad
 */
router.post('/bid', async (req: Request, res: Response): Promise<void> => {
  try {
    const bidRequest: BidRequest = req.body;

    if (!bidRequest.id || !bidRequest.imp) {
      res.status(400).json({ error: 'Invalid Bid Request' });
      return;
    }

    const bidResponse = await AuctionEngine.processBidRequest(bidRequest);

    if (bidResponse) {
      res.status(200).json(bidResponse);
    } else {
      res.status(204).send(); // No Content (No Bid)
    }

  } catch (error) {
    console.error('RTB Auction Error:', error);
    res.status(500).json({ error: 'Internal Auction Error' });
  }
});

export default router;
