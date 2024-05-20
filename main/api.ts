// import axios from 'axios';

// import { v4 } from 'uuid';
// import { sign } from 'jsonwebtoken';
// import * as queryEncode from 'querystring';
// import crypto from 'crypto';
// import * as fs from 'fs';
// import { coinList } from './coinList';

// const accessKey = 'dsfs';
// const secretKey = 'dfdf';

// const payload = {
//   access_key: accessKey,
//   nonce: v4(),
// };

// const token = sign(payload, secretKey);

// // 내 계좌 조회
// export const getAccounts = async () => {
//   return await axios.get('https://api.upbit.com/v1/accounts', {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
// };

// // 안씀
// // export const getMyCoinList = async () => {
// //   return await axios.get('https://api.upbit.com/v1/ticker?markets=KRW-ETH');
// // };

// // BTC, ETH, XRP 현재가 조회
// export const getCoinPrice = async () => {
//   //   return await axios.get(`https://api.upbit.com/v1/ticker?markets=KRW-BTC,KRW-ETH,KRW-XRP`);
//   return await axios.get(`https://api.upbit.com/v1/ticker?markets=${coinList.map((v: any) => v.market).join(',')}`);
// };

// export const orderReservationCoin = async (data, limit, side: string, firstPrice: number) => {
//   const body = {
//     market: data.symbol,
//     side: side, // bid 매수, ask 매도
//     price: firstPrice,
//     volume: data.totalMoney / firstPrice,
//     ord_type: 'limit',
//   };

//   for (let i = 0; i < limit - 1; i++) {
//     if (side === 'bid') {
//       body.price = body.price * (1 - 5 / 100);
//     } else {
//       body.price = body.price * (1 + 5 / 100);
//     }
//   }

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

// // export const orderCoin = async (data) => {
// //   const body = {
// //     market: data.symbol,
// //     side: data.side, // bid 매수, ask 매도
// //     price: data.totalMoney,
// //     ord_type: 'price',
// //   };

// //   const query = queryEncode.encode(body);

// //   const hash = crypto.createHash('sha512');
// //   const queryHash = hash.update(query, 'utf-8').digest('hex');

// //   const payload = {
// //     access_key: accessKey,
// //     nonce: v4(),
// //     query_hash: queryHash,
// //     query_hash_alg: 'SHA512',
// //   };

// //   const token = sign(payload, secretKey);

// //   return await axios.post('https://api.upbit.com/v1/orders', body, {
// //     headers: {
// //       Authorization: `Bearer ${token}`,
// //     },
// //   });
// // };

// export const orderCoin = async (body: any) => {
//   const dataFilePath = `${__dirname}/private_user_data.json`;
//   const userDataFile = fs.readFileSync(dataFilePath, 'utf8');
//   const userData = JSON.parse(userDataFile);
//   const query = queryEncode.encode(body);

//   const hash = crypto.createHash('sha512');
//   const queryHash = hash.update(query, 'utf-8').digest('hex');

//   const payload = {
//     access_key: userData.accessKey,
//     nonce: v4(),
//     query_hash: queryHash,
//     query_hash_alg: 'SHA512',
//   };

//   const token = sign(payload, userData.secretKey);

//   return await axios.post('https://api.upbit.com/v1/orders', body, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
// };

// export const getPurchaseData = async (body: any) => {
//   const query = queryEncode.encode(body);

//   const hash = crypto.createHash('sha512');
//   const queryHash = hash.update(query, 'utf-8').digest('hex');

//   const payload = {
//     access_key: 'qNVJMiRTRK3Nr24cMswV7OUI6cBeZ52lLOOrPAkp',
//     nonce: v4(),
//     query_hash: queryHash,
//     query_hash_alg: 'SHA512',
//   };

//   const token = sign(payload, 'JTJuKZtxvfHZtx52ftjbEFaNLzobWaz4P1Btpsed');

//   try {
//     const response = await axios.get(`https://api.upbit.com/v1/order?${query}`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//       data: body,
//     });
//     console.log(
//       '이게 주문내역 조회한 데이터임-이게 주문내역 조회한 데이터임이게 주문내역 조회한 데이터임이게 주문내역 조회한 데이터임-이게 주문내역 조회한 데이터임이게 주문내역 조회한 데이터임',
//       response,
//     );
//     return response;
//   } catch (error) {
//     console.error(error);
//   }
// };
