export type orderRequest = {
  limit: number;
  moneyPrice: number;
  symbol: string;
  biddingRate: number;
  askingRate: number;
  side: 'bid' | 'ask';
  isFirstAsk?: boolean;
  isRePurchase?: boolean;
};
