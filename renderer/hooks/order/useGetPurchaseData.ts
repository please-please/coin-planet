import { useEffect } from 'react';
import { I_coinOrderResponseData } from '../../api/interface';
import { ipcRenderer } from 'electron';
import { API_REQ_GET_PURCHASE_DATA, API_RES_GET_PURCHASE_DATA, SUCCESS } from '../../../constants';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { LastOrderUuid, LastPurchaseData } from '../../recoil/atom';

export function useGetPurchaseData() {
  const setLastPurchaseData = useSetRecoilState(LastPurchaseData);
  const [lastOrderUuid, setLastOrderUuid] = useRecoilState(LastOrderUuid);

  const getPurchaseData = (uuid: I_coinOrderResponseData['uuid']) => {
    ipcRenderer.send(API_REQ_GET_PURCHASE_DATA, { uuid });

    ipcRenderer.once(API_RES_GET_PURCHASE_DATA, (_, arg) => {
      if (arg.status === SUCCESS) {
        setLastPurchaseData(arg.data);
      }
    });
  };

  useEffect(() => {
    if (lastOrderUuid) {
      setTimeout(() => {
        getPurchaseData(lastOrderUuid);
        setLastOrderUuid('');
      }, 500);
    }
  }, [lastOrderUuid]);
}
