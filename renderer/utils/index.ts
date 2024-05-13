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
import { I_assetsData } from '../pages/main';
import electron from 'electron';

interface I_keys {
  accessKey: string;
  secretKey: string;
}

const ipcRenderer = electron.ipcRenderer;

export const getProfitLoss = (assetData: I_assetsData, tickerData: I_tickerData[]) => {
  const totalData = {
    'KRW-BTC': [],
    'KRW-ETH': [],
    'KRW-XRP': [],
  };

  for (let key of Object.keys(totalData)) {
    totalData[key] = assetData[key]?.bid?.map(
      (item) =>
        +((tickerData[tickerData.findIndex((v) => v.market === key)].trade_price - +item.price) * +item.volume).toFixed(
          2,
        ),
    );
  }

  return totalData;
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
