export interface I_orderBody {
  market: string;
  side: 'bid' | 'ask';
  volume?: number;
  price: number;
  ord_type: 'limit' | 'price' | 'market' | 'best';
  identifier?: string;
  time_in_force?: string;
}

export interface I_tickerData {
  market: string;
  change: 'EVEN' | 'RISE' | 'FALL'; // 보합, 상승, 하락
  change_price: number; // 변화액
  trade_price: number; // 종가(현재가)
  prev_closing_price: number; // 전일 종가
}
