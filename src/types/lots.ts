export interface SecurityLot {
  id: string;
  portfolio_id: string;
  security_id: string;
  open_date: string;
  quantity: number;
  price_per_share: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SecurityLotFormData {
  open_date: string;
  quantity: string;
  price_per_share: string;
  notes?: string;
}

export interface SecurityLotTotals {
  total_shares: number;
  total_cost: number;
  average_cost: number;
}

export interface SecurityWithLots {
  security: {
    id: string;
    ticker: string;
    name: string;
    sector: string;
    industry: string;
    price: number;
    // ... other security fields
  };
  lots: SecurityLot[];
  totals: SecurityLotTotals;
} 