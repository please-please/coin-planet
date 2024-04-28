import { I_coinOrderResponseData } from '../api/interface';

export interface I_assetBid extends Pick<I_coinOrderResponseData, 'price' | 'volume' | 'ord_type' | 'created_at'> {
  number: number;
}
