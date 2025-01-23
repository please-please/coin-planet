import { ipcRenderer } from 'electron';
import { useEffect, useState } from 'react';
import { GET_PURCHASE_DATA_LOG, GET_PURCHASE_DATA_LOG_RETURN } from '../../../constants';
import { I_getPurchaseDataLogReturn, I_sortedPurchaseData } from '../../constants/interface';

export const useGetSortedPurchaseData = () => {
  const [sortedPurchaseData, setSortedPurchaseData] = useState<I_sortedPurchaseData>();

  const refetch = () => {
    ipcRenderer.send(GET_PURCHASE_DATA_LOG, { market: 'raw' });
    ipcRenderer.once(GET_PURCHASE_DATA_LOG_RETURN, (_, arg: I_getPurchaseDataLogReturn) => {
      if (arg.status === 200) {
        const sortedData: I_sortedPurchaseData = {};
        const keys = Object.keys(arg.data);

        for (let i = 0; i < keys.length; i++) {
          let coinData = arg.data[keys[i]];
          const newData = [...coinData.ask, ...coinData.bid].sort((a, b) =>
            new Date(a.created_at) > new Date(b.created_at) ? 1 : -1,
          );
          sortedData[keys[i]] = newData;
        }

        setSortedPurchaseData(sortedData);
      }
    });
  };

  useEffect(() => {
    refetch();
  }, []);

  return { sortedPurchaseData, refetch };
};
