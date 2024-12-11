export interface orderArg {
  market: string;
  inputPrice: number;
  number?: number;
}

export interface settingArg {
  market: string;
  biddingRate?: number;
  askingRate?: number;
  inputPrice?: number;
  limit?: number;
}

export interface marketData {
  market: string;
  biddingRate: number;
  askingRate: number;
  inputPrice: number;
  limit: number;
  watching: boolean;
  boosting: boolean;
}

export interface settingDataType {
  [key: string]: marketData;
}
