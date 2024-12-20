import { FAIL, ORDER_BID, ORDER_BID_RETURN } from '../../../constants/index';
import { ipcRenderer } from 'electron';
import { I_orderBody } from '../../api/interface';
import React from 'react';
import { useSetRecoilState } from 'recoil';
import { LastOrderUuid } from '../../recoil/atom';

export function useOrderCoin() {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const setLastOrderUuid = useSetRecoilState(LastOrderUuid);

  const orderCoin = (body: I_orderBody) => {
    setIsLoading(true);

    ipcRenderer.send(ORDER_BID, body);

    ipcRenderer.once(ORDER_BID_RETURN, (_, arg) => {
      if (arg.status === FAIL) return alert('error: API_RES_ORDER_COIN 실패');
      setLastOrderUuid(arg.data.uuid);
      setIsLoading(false);
    });
  };

  return { orderCoin, isLoading };
}
