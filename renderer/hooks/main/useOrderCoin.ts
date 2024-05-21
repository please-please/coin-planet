import { API_RES_ORDER_COIN, SUCCESS } from './../../../constants/index';
import { ipcRenderer } from 'electron';
import { API_REQ_ORDER_COIN } from '../../../constants';
import { I_orderBody } from '../../api/interface';
import React from 'react';

export default function useOrderCoin() {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const orderCoin = async (body: I_orderBody) => {
    setIsLoading(true);

    ipcRenderer.send(API_REQ_ORDER_COIN, body);

    ipcRenderer.once(API_RES_ORDER_COIN, (_, arg) => {
      if (arg.status === SUCCESS) {
        console.log(arg);
        setIsLoading(false);
        return arg.data;
      }
    });
  };

  return { orderCoin, isLoading };
}
