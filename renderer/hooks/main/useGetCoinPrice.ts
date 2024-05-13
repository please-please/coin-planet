import { useEffect, useState } from 'react';
import { getCoinPrice } from '../../api/api';
import { I_tickerData } from '../../api/interface';

export const useGetCoinPrice = () => {
  const [tickerData, setTickerData] = useState<I_tickerData[]>();
  const [isFetched, setIsFetched] = useState<boolean>();

  const reload = async () => {
    setIsFetched(false);

    getCoinPrice()
      .then((res) => {
        setTickerData(res.data);
        setIsFetched(true);
      })
      .catch(() => alert('조회 오류!'));
  };

  useEffect(() => {
    reload();
  }, []);

  return { tickerData, reload, isFetched };
};
