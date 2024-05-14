import axios, { AxiosResponse } from 'axios';

import { v4 } from 'uuid';
import { sign } from 'jsonwebtoken';
import * as queryEncode from 'querystring';
import crypto from 'crypto';
import { I_coinOrderResponseData, I_orderBody, I_orderReservationData, I_tickerData } from './interface';
import { coinList } from '../constants/coinList';

const accessKey = 'dsfs';
const secretKey = 'dfdf';

const payload = {
  access_key: accessKey,
  nonce: v4(),
};

const token = sign(payload, secretKey);

// 내 계좌 조회
export const getAccounts = async () => {
  return await axios.get('https://api.upbit.com/v1/accounts', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// 안씀
// export const getMyCoinList = async () => {
//   return await axios.get('https://api.upbit.com/v1/ticker?markets=KRW-ETH');
// };

// BTC, ETH, XRP 현재가 조회
export const getCoinPrice = async (): Promise<AxiosResponse<I_tickerData[]>> => {
  return await axios.get(`https://api.upbit.com/v1/ticker?markets=${coinList.map((v) => v.market).join(',')}`);
};

export const orderReservationCoin = async (
  data: I_orderReservationData,
  limit: number,
  firstPrice: string | number,
) => {
  const body = {
    market: data.market,
    side: data.side, // bid 매수, ask 매도
    price: firstPrice,
    volume: data.inputPrice / +firstPrice,
    ord_type: 'limit',
  };

  for (let i = 0; i < limit - 1; i++) {
    if (data.side === 'bid') {
      body.price = +body.price * (1 - 5 / 100);
    } else {
      body.price = +body.price * (1 + 5 / 100);
    }
  }

  const query = queryEncode.encode(body);

  const hash = crypto.createHash('sha512');
  const queryHash = hash.update(query, 'utf-8').digest('hex');

  const payload = {
    access_key: accessKey,
    nonce: v4(),
    query_hash: queryHash,
    query_hash_alg: 'SHA512',
  };

  const token = sign(payload, secretKey);

  return await axios.post('https://api.upbit.com/v1/orders', body, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// export const orderCoin = async (data) => {
//   const body = {
//     market: data.symbol,
//     side: data.side, // bid 매수, ask 매도
//     price: data.totalMoney,
//     ord_type: 'price',
//   };

//   const query = queryEncode.encode(body);

//   const hash = crypto.createHash('sha512');
//   const queryHash = hash.update(query, 'utf-8').digest('hex');

//   const payload = {
//     access_key: accessKey,
//     nonce: v4(),
//     query_hash: queryHash,
//     query_hash_alg: 'SHA512',
//   };

//   const token = sign(payload, secretKey);

//   return await axios.post('https://api.upbit.com/v1/orders', body, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
// };

export const orderCoin = async (token: string, body: I_orderBody): Promise<AxiosResponse<I_coinOrderResponseData>> => {
  return await axios.post('https://api.upbit.com/v1/orders', body, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getPurchaseData = async (body: any) => {
  const query = queryEncode.encode(body);

  const hash = crypto.createHash('sha512');
  const queryHash = hash.update(query, 'utf-8').digest('hex');

  const payload = {
    access_key: 'qNVJMiRTRK3Nr24cMswV7OUI6cBeZ52lLOOrPAkp',
    nonce: v4(),
    query_hash: queryHash,
    query_hash_alg: 'SHA512',
  };

  const token = sign(payload, 'JTJuKZtxvfHZtx52ftjbEFaNLzobWaz4P1Btpsed');

  try {
    const response = await axios.get(`https://api.upbit.com/v1/order?${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: body,
    });
    console.log(
      '이게 주문내역 조회한 데이터임-이게 주문내역 조회한 데이터임이게 주문내역 조회한 데이터임이게 주문내역 조회한 데이터임-이게 주문내역 조회한 데이터임이게 주문내역 조회한 데이터임',
      response,
    );
    return response;
  } catch (error) {
    console.error(error);
  }
};
