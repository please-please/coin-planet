import { useEffect, useState } from 'react';
import { I_tickerData } from '../../api/interface';
import { ipcRenderer } from 'electron';
import { API_REQ_GET_COIN_CURRENT_PRICE, API_RES_COIN_CURRENT_PRICE_RETURN, FAIL } from '../../../constants';

export const useGetCoinPrice = () => {
  const [tickerData, setTickerData] = useState<I_tickerData[]>();
  const [isFetched, setIsFetched] = useState<boolean>();

  const reload = () => {
    setIsFetched(false);

    ipcRenderer.send(API_REQ_GET_COIN_CURRENT_PRICE);

    ipcRenderer.once(API_RES_COIN_CURRENT_PRICE_RETURN, (_, arg) => {
      if (arg.status === FAIL) return alert('조회 오류!');
      setTickerData(arg.data);
      setIsFetched(true);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  return { tickerData, reload, isFetched };
};
