import { ParsedUrlQueryInput } from 'querystring';

export interface I_coinOrderResponseData {
  created_at: string;
  executed_volume: string | number;
  locked: string | number;
  market: string;
  ord_type: 'limit' | 'price' | 'market' | 'best';
  paid_fee: string | number;
  price: string | number;
  remaining_fee: string | number;
  remaining_volume: string | number;
  reserved_fee: string | number;
  side: 'bid' | 'ask';
  state: string;
  trades_count: number;
  uuid: string;
  volume: string | number;
}

export interface I_orderBody
  extends ParsedUrlQueryInput,
    Pick<I_coinOrderResponseData, 'market' | 'side' | 'ord_type' | 'price' | 'volume'> {
  identifier?: string;
  time_in_force?: string;
}

export interface I_orderReservationData extends Pick<I_orderBody, 'market' | 'side'> {
  inputPrice: number;
}

export interface I_tickerData {
  market: string;
  change: 'EVEN' | 'RISE' | 'FALL'; // 보합, 상승, 하락
  change_price: number; // 변화액
  trade_price: number; // 종가(현재가)
  prev_closing_price: number; // 전일 종가
  timestamp: number;
}

interface I_bidData extends Pick<I_coinOrderResponseData, 'price' | 'ord_type'> {
  number: number;
  inputPrice: number;
  volume?: I_coinOrderResponseData['volume'];
  created_at?: I_coinOrderResponseData['created_at'];
}

interface I_askData extends I_bidData {}

export interface I_coinOrderData {
  [key: string]: {
    bid: I_bidData[];
    ask: I_askData[];
    limit?: number;
  };
}

export interface I_orderArg {
  market: string;
  side: 'bid' | 'ask';
  inputPrice: number;
  coinPriceData: { [key: string]: number };
  ord_type: 'limit' | 'price' | 'market' | 'best';
}
