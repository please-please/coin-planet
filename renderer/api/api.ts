import axios, { AxiosResponse } from 'axios';

import { I_coinOrderResponseData, I_orderBody } from './interface';
// import { coinList } from '../constants/coinList';

// // BTC, ETH, XRP 현재가 조회
// export const getCoinPrice = async (): Promise<AxiosResponse<I_tickerData[]>> => {
//   return await axios.get(`https://api.upbit.com/v1/ticker?markets=${coinList.map((v) => v.market).join(',')}`);
// };

// export const orderCoin = async (token: string, body: I_orderBody): Promise<AxiosResponse<I_coinOrderResponseData>> => {
//   return await axios.post('https://api.upbit.com/v1/orders', body, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
// };

export const getPurchaseData = async (body: any, token: any) => {
  return await axios.get(`https://api.upbit.com/v1/order?uuid=${body.uuid}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: body,
  });
};
