export interface I_orderBody {
  market: string;
  side: 'bid' | 'ask';
  volume?: number;
  price: number;
  ord_type: 'limit' | 'price' | 'market' | 'best';
  identifier?: string;
  time_in_force?: string;
}
