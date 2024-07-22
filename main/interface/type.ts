export type orderRequest = {
  limit: number;
  moneyPrice: number;
  symbol: string;
  biddingRate: number;
  askingRate: number;
  isFirstAsk?: boolean;
  isRePurchase?: boolean;
};
