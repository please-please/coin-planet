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
import { I_coinOrderData, I_orderBody, I_tickerData } from '../api/interface';
import { coinList } from '../constants/coinList';
import { I_assetsData } from '../pages/main';
import electron from 'electron';

interface I_keys {
  accessKey: string;
  secretKey: string;
}

interface I_profitLoss {
  [market: string]: [number, number, number];
}

const ipcRenderer = electron.ipcRenderer;

export const getProfitLoss = (assetData: I_assetsData, tickerData: I_tickerData[]): I_profitLoss => {
  const totalData = {};
  for (let i = 0; i < coinList.length; i++) {
    totalData[coinList[i].market] = [];
  }

  for (let key of Object.keys(totalData)) {
    totalData[key] = assetData[key]?.bid?.map((item) => {
      const marketData = tickerData[tickerData.findIndex((v) => v.market === key)];

      return [
        +((marketData.trade_price - +item.price) * +item.volume).toFixed(2), // 손익액
        +((marketData.trade_price - +item.price) / +marketData.prev_closing_price).toFixed(2), // 손익율
        +item.volume, // 구매 수량
      ];
    });
  }

  return totalData;
};

export const getTotalProfitLoss = (profitLoss: number[], tickerData: I_tickerData): [number, number] => {
  const closingPrice = tickerData.prev_closing_price;
  const totalProfitLoss = [
    // 손익액 합게
    +profitLoss.reduce((p, c) => p + c[0], 0),
    // 손익액 합계 / 구매량 합계 / 현재가 -> 전체 손익율
    +(+profitLoss.reduce((p, c) => p + c[0], 0) / profitLoss.reduce((p, c) => p + c[2], 0) / closingPrice).toFixed(2),
  ] as [number, number];

  return totalProfitLoss;
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

export const getToken = (failCallback: () => void, successCallback?: (arg: any) => void, body?: I_orderBody) => {
  ipcRenderer.send(GET_TOKEN, body ? { body } : {});
  ipcRenderer.once(TOKEN_RETURN, (_, arg) => {
    if (arg.status === FAIL) return failCallback();
    if (successCallback) successCallback(arg);
  });
};

export const orderFirst = (firstOrderData: I_coinOrderData) => {
  ipcRenderer.send(ORDER_FIRST, firstOrderData);
};

export const orderReservation = (nextOrderData: I_coinOrderData) => {
  ipcRenderer.send(ORDER_RESERVATION, nextOrderData);
  ipcRenderer.once(RESERVATION_ORDER_RETURN, (_, arg) => {
    if (arg.status === FAIL) return alert('에러: reservation order 실패');
    alert('주문 성공');
  });
};
