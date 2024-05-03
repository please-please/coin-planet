import { atom } from 'recoil';

export const MyAssets = atom({
  key: 'MyAssets',
  default: {},
});

export const MyReservations = atom({
  key: 'MyReservations',
  default: [],
});

export const MyUserData = atom({
  key: 'MyUserData',
  default: {
    accessKey: '',
    secretKey: '',
  },
});

export const HasAsk = atom<{ [key: string]: boolean }>({
  key: 'HasAsk',
  default: {
    'KRW-BTC': false,
    'KRW-ETH': false,
    'KRW-XRP': false,
  },
});
