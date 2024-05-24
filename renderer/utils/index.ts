import {
  FAIL,
  GET_TOKEN,
  ORDER_FIRST,
  ORDER_RESERVATION,
  REPLY,
  RESERVATION_ORDER_RETURN,
  SAVE_FILE,
  TOKEN_RETURN,
} from '../../constants';
import { I_coinOrderData, I_tickerData } from '../api/interface';
import { coinList } from '../constants/coinList';
import electron from 'electron';

interface I_keys {
  accessKey: string;
  secretKey: string;
}

interface I_profitLoss {
  [market: string]: [number, number, number];
}

const ipcRenderer = electron.ipcRenderer;

const shortenRate = (number: number) => {
  if (number > 1) return +number.toFixed(2);

  let shortRate = 0;
  let i = 2;
  while (shortRate === 0) {
    shortRate = +number.toFixed(i);
    i++;
  }

  return shortRate;
};

export const getProfitLoss = (assetData: I_coinOrderData, tickerData: I_tickerData[]): I_profitLoss => {
  const totalData = {};
  for (let i = 0; i < coinList.length; i++) {
    totalData[coinList[i].market] = [];
  }

  for (let key of Object.keys(totalData)) {
    totalData[key] = assetData[key]?.bid?.map((item) => {
      const marketData = tickerData[tickerData.findIndex((v) => v.market === key)];

      const profitLoss = +((marketData.trade_price - +item.price) * +item.volume).toFixed(2);
      const profitLossRate = (marketData.trade_price - +item.price) / +marketData.prev_closing_price;
      const shortProfitLossRate = shortenRate(profitLossRate);

      return [profitLoss, shortProfitLossRate, +item.volume];
    });
  }

  return totalData;
};

export const getTotalProfitLoss = (profitLoss: number[], tickerData: I_tickerData): [number, number] => {
  const closingPrice = tickerData.prev_closing_price;
  // 손익액 합게
  const total = +profitLoss.reduce((p, c) => p + c[0], 0);
  // 손익액 합계 / 구매량 합계 / 현재가 -> 전체 손익율
  const profitLossRate = +(
    +profitLoss.reduce((p, c) => p + c[0], 0) /
    profitLoss.reduce((p, c) => p + c[2], 0) /
    closingPrice
  );
  const shortProfitLossRate = shortenRate(profitLossRate);

  return [total, shortProfitLossRate] as [number, number];
};

export const saveUserKey = (
  keys: I_keys,
  callback: () => void,
  successCallback: () => void,
  failCallback: () => void,
) => {
  ipcRenderer.send(SAVE_FILE, keys);
  ipcRenderer.once(REPLY, (_, arg) => {
    callback();
    if (arg.status === FAIL) return failCallback();
    successCallback();
  });
};

export const getToken = (failCallback: () => void, successCallback?: (arg: any) => void, body?: any) => {
  ipcRenderer.send(GET_TOKEN, body ? { body } : {});
  ipcRenderer.once(TOKEN_RETURN, (_, arg) => {
    if (arg.status === FAIL) return failCallback();
    if (successCallback) successCallback(arg);
  });
};

export const saveFirstOrder = (firstOrderData: I_coinOrderData) => {
  ipcRenderer.send(ORDER_FIRST, firstOrderData);
};

export const saveOrderReservation = (nextOrderData: I_coinOrderData) => {
  ipcRenderer.send(ORDER_RESERVATION, nextOrderData);
  ipcRenderer.once(RESERVATION_ORDER_RETURN, (_, arg) => {
    console.log(arg);
    if (arg.status === FAIL) return alert('에러: reservation order 저장 실패');
    alert('주문 저장 성공');
  });
};
