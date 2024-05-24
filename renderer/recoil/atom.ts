import { atom } from 'recoil';
import { I_coinOrderData, I_coinOrderResponseData, I_purchaseData } from '../api/interface';
import { I_hasAsk } from './interface';

export const MyAssets = atom<I_coinOrderData>({
  key: 'MyAssets',
  default: {},
});

export const MyReservations = atom<I_coinOrderData[]>({
  key: 'MyReservations',
  default: [],
});

export const HasAsk = atom<I_hasAsk>({
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
