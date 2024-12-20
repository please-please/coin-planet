import { useEffect, useState } from 'react';
import { I_tickerData } from '../../api/interface';
import { ipcRenderer } from 'electron';
import { FAIL, GET_CURRENT_PRICE, GET_CURRENT_PRICE_RETURN } from '../../../constants';

export const useGetCoinPrice = () => {
  const [tickerData, setTickerData] = useState<I_tickerData[]>();
  const [isFetched, setIsFetched] = useState<boolean>();

  const reload = () => {
    setIsFetched(false);

    ipcRenderer.send(GET_CURRENT_PRICE);

    ipcRenderer.once(GET_CURRENT_PRICE_RETURN, (_, arg) => {
      console.log(arg, 'arg');
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
