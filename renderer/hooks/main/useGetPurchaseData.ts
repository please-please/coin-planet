import React from 'react';
import { I_coinOrderResponseData } from '../../api/interface';
import { ipcRenderer } from 'electron';
import { API_REQ_GET_PURCHASE_DATA, API_RES_GET_PURCHASE_DATA, SUCCESS } from '../../../constants';
import { useRecoilState } from 'recoil';
import { LastPurchaseData } from '../../recoil/atom';

export default function useGetPurchaseData() {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [, setLastPurchaseData] = useRecoilState(LastPurchaseData);

  const getPurchaseData = (uuid: I_coinOrderResponseData['uuid']) => {
    setIsLoading(true);

    console.log('uuid 보냇음');

    ipcRenderer.send(API_REQ_GET_PURCHASE_DATA, { uuid });

    ipcRenderer.once(API_RES_GET_PURCHASE_DATA, (_, arg) => {
      console.log(arg);
      if (arg.status === SUCCESS) {
        console.log(arg.data);
        setLastPurchaseData(arg.data);
      }
    });
  };

  return { getPurchaseData, isLoading };
}
