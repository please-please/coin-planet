import { API_RES_ORDER_COIN, FAIL } from '../../../constants/index';
import { ipcRenderer } from 'electron';
import { API_REQ_ORDER_COIN } from '../../../constants';
import { I_orderBody } from '../../api/interface';
import React from 'react';
import { useSetRecoilState } from 'recoil';
import { LastOrderUuid } from '../../recoil/atom';

export function useOrderCoin() {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const setLastOrderUuid = useSetRecoilState(LastOrderUuid);

  const orderCoin = (body: I_orderBody) => {
    setIsLoading(true);

    ipcRenderer.send(API_REQ_ORDER_COIN, body);

    ipcRenderer.once(API_RES_ORDER_COIN, (_, arg) => {
      if (arg.status === FAIL) return alert('error: API_RES_ORDER_COIN 실패');
      setLastOrderUuid(arg.data.uuid);
      setIsLoading(false);
    });
  };

  return { orderCoin, isLoading };
}
