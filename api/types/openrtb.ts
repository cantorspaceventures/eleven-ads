// OpenRTB 2.6 Simplified Types

export interface BidRequest {
  id: string;
  imp: Impression[];
  device?: Device;
  user?: User;
  at?: number; // Auction Type: 1 = First Price, 2 = Second Price
  tmax?: number; // Timeout in ms
}

export interface Impression {
  id: string;
  banner?: Banner;
  video?: Video;
  audio?: Audio;
  bidfloor?: number; // Floor price in CPM
  bidfloorcur?: string; // Currency (e.g. "AED")
}

export interface Banner {
  w: number;
  h: number;
  format?: Format[];
}

export interface Format {
  w: number;
  h: number;
}

export interface Video {
  mimes: string[];
  minduration?: number;
  maxduration?: number;
  protocols?: number[];
  w?: number;
  h?: number;
  dsp_name?: string; // Source DSP name
}

export interface Audio {
  mimes: string[];
  minduration?: number;
  maxduration?: number;
}

export interface Device {
  geo?: Geo;
  ua?: string; // User Agent
  ip?: string;
  devicetype?: number; // 4 = Phone, 5 = Tablet
}

export interface Geo {
  lat?: number;
  lon?: number;
  city?: string;
  country?: string;
}

export interface User {
  id?: string;
  keywords?: string; // Comma separated interests
  gender?: 'M' | 'F' | 'O';
  yob?: number; // Year of Birth
}

export interface BidResponse {
  id: string; // Reflection of request ID
  seatbid: SeatBid[];
  bidid?: string;
  cur?: string;
}

export interface SeatBid {
  bid: Bid[];
  seat?: string; // Advertiser ID
}

export interface Bid {
  id: string;
  impid: string; // Reference to Impression ID
  price: number; // Bid Price in CPM
  adm?: string; // Ad Markup (HTML/URL)
  crid?: string; // Creative ID
  w?: number;
  h?: number;
}
