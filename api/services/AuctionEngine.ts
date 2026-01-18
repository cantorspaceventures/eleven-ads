import { supabaseAdmin } from '../lib/supabase.js';
import type { BidRequest, BidResponse, Bid, Impression } from '../types/openrtb.js';

export class AuctionEngine {
  /**
   * Process a Bid Request and run a Second-Price Auction
   * Aggregates bids from Internal Campaigns AND External DSPs
   */
  static async processBidRequest(request: BidRequest): Promise<BidResponse | null> {
    console.log(`[Auction] Processing Bid Request: ${request.id}`);
    
    // 1. Fetch External Bids (Parallel)
    const externalBidsPromise = this.fetchExternalBids(request);
    
    // 2. Fetch Internal Campaigns
    const internalBidsPromise = this.fetchInternalBids(request);

    // 3. Aggregate All Bids
    const [externalBids, internalBids] = await Promise.all([externalBidsPromise, internalBidsPromise]);
    const allBids = [...externalBids, ...internalBids];

    if (allBids.length === 0) {
      console.log('[Auction] No eligible bids found');
      return null;
    }

    // 4. Second-Price Auction Logic
    // Sort bids by price descending
    allBids.sort((a, b) => b.price - a.price);

    const winner = allBids[0];
    const runnerUp = allBids[1];
    const imp = request.imp[0];

    // Winner pays: RunnerUp Price + 0.01 OR Floor Price (if no runner up)
    let clearingPrice = runnerUp ? runnerUp.price + 0.01 : (imp.bidfloor || 0.01);
    
    // Cap clearing price at winner's bid
    clearingPrice = Math.min(clearingPrice, winner.price);

    console.log(`[Auction] Winner: ${winner.id} @ AED ${clearingPrice} (Bid: ${winner.price})`);

    // 5. Construct Response
    const response: BidResponse = {
      id: request.id,
      cur: 'AED',
      seatbid: [{
        seat: (winner as any).dsp_name || 'elevenads-dsp', // Identify if winner is external
        bid: [{
          ...winner,
          price: clearingPrice // Update price to clearing price
        }]
      }]
    };

    return response;
  }

  // --- Internal Bidding Logic ---
  private static async fetchInternalBids(request: BidRequest): Promise<Bid[]> {
    const { data: campaigns, error } = await supabaseAdmin
      .from('campaigns')
      .select('id, advertiser_id, max_cpm_bid, targeting, creatives(*)')
      .eq('status', 'active')
      .gt('max_cpm_bid', 0);

    if (error || !campaigns) return [];

    const imp = request.imp[0];
    const bids: Bid[] = [];

    for (const campaign of campaigns) {
      const targetCity = request.device?.geo?.city;
      const allowedCities = campaign.targeting?.locations || [];
      if (allowedCities.length > 0 && targetCity && !allowedCities.includes(targetCity)) continue;

      const creative = campaign.creatives?.[0];
      if (!creative) continue;

      const bidPrice = Number(campaign.max_cpm_bid) * 0.9;
      if (imp.bidfloor && bidPrice < imp.bidfloor) continue;

      bids.push({
        id: crypto.randomUUID(),
        impid: imp.id,
        price: bidPrice,
        adm: creative.url,
        crid: creative.id,
        w: imp.banner?.w || 300,
        h: imp.banner?.h || 250
      });
    }
    return bids;
  }

  // --- External DSP Broadcaster ---
  private static async fetchExternalBids(request: BidRequest): Promise<Bid[]> {
    try {
      // In a real app, fetch from 'connected_dsps' table
      // const { data: dsps } = await supabaseAdmin.from('connected_dsps').select('*').eq('is_active', true);
      
      // Mocked External DSPs
      const mockDSPs = [
        { name: 'TradeDesk-Mock', url: 'http://localhost:3000/api/mock-dsp/ttd' },
        { name: 'Google-DV360-Mock', url: 'http://localhost:3000/api/mock-dsp/dv360' }
      ];

      const bidPromises = mockDSPs.map(async (dsp) => {
        try {
          // Simulate network request (mocked response for now)
          // const res = await fetch(dsp.url, { method: 'POST', body: JSON.stringify(request) });
          // const bidResponse = await res.json();
          
          // Simulating a random bid from external DSPs
          const shouldBid = Math.random() > 0.5;
          if (!shouldBid) return null;

          const bidPrice = 20 + Math.random() * 50; // Random bid between 20-70 AED
          const imp = request.imp[0];

          if (imp.bidfloor && bidPrice < imp.bidfloor) return null;

          return {
            id: crypto.randomUUID(),
            impid: imp.id,
            price: bidPrice,
            adm: 'https://via.placeholder.com/300x250?text=External+DSP+Ad',
            crid: `ext-${dsp.name}`,
            w: 300,
            h: 250,
            dsp_name: dsp.name // Custom field to track source
          } as Bid;

        } catch (e) {
          return null;
        }
      });

      const results = await Promise.all(bidPromises);
      return results.filter((b): b is Bid => b !== null);

    } catch (error) {
      console.error('External DSP Error:', error);
      return [];
    }
  }
}
