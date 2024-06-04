import {
  API_REQ_JSON_EXPORT,
  API_REQ_JSON_SAVE,
  API_RES_JSON_EXPORT,
  API_RES_JSON_SAVE,
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
      // 매수금액
      const purchaseAmount = +item.price * +item.volume;
      // 평가손익
      const evaluatedProfitLoss = marketData.trade_price * +item.volume - purchaseAmount;
      // 손익율
      const profitLossRate = (evaluatedProfitLoss / purchaseAmount) * 100;

      const shortProfitLossRate = shortenRate(profitLossRate);

      return [profitLoss, shortProfitLossRate, +item.volume, +item.price];
    });
  }

  return totalData;
};

export const getTotalProfitLoss = (profitLoss: number[]): [number, number] => {
  // 전체 매수 금액
  const totalPurchaseAmount = +profitLoss.reduce((p, c) => p + c[2] * c[3], 0);
  // 평가 손익
  const evaluatedProfitLoss = +profitLoss.reduce((p, c) => p + c[0], 0);
  // 손익율
  const profitLossRate = (evaluatedProfitLoss / totalPurchaseAmount) * 100;
  const shortProfitLossRate = shortenRate(profitLossRate);

  return [evaluatedProfitLoss, shortProfitLossRate] as [number, number];
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
    if (arg.status === FAIL) return alert('에러: reservation order 저장 실패');
    alert('주문 저장 성공');
  });
};

export const downloadJSON = () => {
  ipcRenderer.send(API_REQ_JSON_EXPORT);
  ipcRenderer.once(API_RES_JSON_EXPORT, (_, arg) => {
    if (arg.status === FAIL) return alert('에러: 데이터 저장 실패');
    return alert('데이터 저장 성공');
  });
};

export const uploadJSON = (file: File, successCallback: () => void) => {
  ipcRenderer.send(API_REQ_JSON_SAVE, file.path);
  ipcRenderer.once(API_RES_JSON_SAVE, (_, arg) => {
    if (arg.status === FAIL) return alert('에러: 파일 업로드 실패');
    return successCallback();
  });
};
