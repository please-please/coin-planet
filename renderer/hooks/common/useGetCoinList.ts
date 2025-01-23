import { useCallback, useEffect, useState } from 'react';
import { ipcRenderer } from 'electron';
import { GET_COIN_LIST, GET_COIN_LIST_RETURN } from '../../../constants';

export const useGetCoinList = () => {
  const reload = useCallback(() => {
    ipcRenderer.send(GET_COIN_LIST);

    ipcRenderer.once(GET_COIN_LIST_RETURN, (_, arg) => {
      console.log(arg, 'getcoinlist');

      // if (arg.status === FAIL) return alert('조회 오류!');
      // setTickerData(arg);
      // setIsFetched(true);
    });
  }, []);

  useEffect(() => {
    reload();
  }, []);

  return { reload };
};
