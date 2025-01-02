/** order */
export interface I_coinDataItem {
  name: string;
  market: string;
  currentPrice: number;
  firstOrder: boolean;
  watching: boolean;
  boosting: boolean;
}

export interface I_saveCoinSettingArg {
  market: string;
  biddingRate?: number;
  askingRate?: number;
  inputPrice?: number;
  limit?: number;
  watching?: boolean;
  boosting?: boolean;
  firstOrder?: boolean;
}

export interface I_coinSettingData {
  [key: string]: I_saveCoinSettingArg;
}

export interface I_orderInputError {
  inputPrice: boolean;
  askingRate: boolean;
  biddingRate: boolean;
  limit: boolean;
}

export interface I_orderArg {
  market: string;
  inputPrice: number;
}
