import { atom } from 'recoil';
import { I_coinOrderData, I_coinOrderResponseData } from '../api/interface';

export const MyAssets = atom<I_coinOrderData>({
  key: 'MyAssets',
  default: {},
});

export const MyReservations = atom<I_coinOrderData[]>({
  key: 'MyReservations',
  default: [],
});

export const LastOrderUuid = atom<I_coinOrderResponseData['uuid']>({
  key: 'LastOrderUuid',
  default: '',
});
