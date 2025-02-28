import { useCallback, useEffect, useState } from 'react';
import { I_tickerData } from '../../api/interface';
import { ipcRenderer } from 'electron';
import { FAIL, GET_CURRENT_PRICE, GET_CURRENT_PRICE_RETURN } from '../../../constants';
import { COIN_LIST } from '../../constants/coinList';

export const useGetCoinPrice = () => {
  const [tickerData, setTickerData] = useState<I_tickerData[]>();
  const [isFetched, setIsFetched] = useState<boolean>();

  const reload = useCallback(() => {
    setIsFetched(false);

    const symbols = COIN_LIST.map((coin) => coin.market);
    ipcRenderer.send(GET_CURRENT_PRICE, symbols);

    ipcRenderer.once(GET_CURRENT_PRICE_RETURN, (_, arg) => {
      if (arg.status === FAIL) return alert('조회 오류!');
      setTickerData(arg);
      setIsFetched(true);
    });
  }, []);

  useEffect(() => {
    reload();
  }, []);

  return { tickerData, reload, isFetched };
};
