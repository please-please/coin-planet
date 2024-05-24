import { atom } from 'recoil';
import { I_coinOrderResponseData, I_purchaseData } from '../api/interface';

export const MyAssets = atom({
  key: 'MyAssets',
  default: {},
});

export const MyReservations = atom({
  key: 'MyReservations',
  default: [],
});

export const HasAsk = atom<{ [key: string]: boolean }>({
  key: 'HasAsk',
  default: {
    'KRW-BTC': false,
    'KRW-ETH': false,
    'KRW-XRP': false,
  },
});

export const LastOrderUuid = atom<I_coinOrderResponseData['uuid']>({
  key: 'LastOrderUuid',
  default: '',
});

export const LastPurchaseData = atom<I_purchaseData | undefined>({
  key: 'LastPurchaseData',
  default: undefined,
});
