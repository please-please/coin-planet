import { atom } from 'recoil';

export const MyAssets = atom({
  key: 'MyAssets',
  default: [],
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
