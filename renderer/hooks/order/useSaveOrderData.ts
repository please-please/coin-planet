import { LastPurchaseData } from '../../recoil/atom';
import React from 'react';
import { useRecoilState } from 'recoil';
import { I_coinOrderData } from '../../api/interface';
import { saveFirstOrder, saveOrderReservation } from '../../utils';

export function useSaveOrderData(orderData: I_coinOrderData) {
  const [lastpuchaseData, setLastpuchaseData] = useRecoilState(LastPurchaseData);

  React.useEffect(() => {
    if (lastpuchaseData) {
      const market = Object.keys(orderData)[0];
      const bidData = orderData[market].bid[0];

      bidData.number = 1;
      bidData.price = +lastpuchaseData?.trades[0]?.price;
      bidData.created_at = lastpuchaseData?.trades[0]?.created_at;
      bidData.volume = lastpuchaseData?.trades[0]?.volume;

      saveFirstOrder(orderData);

      const reservationData: I_coinOrderData = {
        [market]: {
          bid: [
            {
              number: 2,
              price: (+lastpuchaseData?.trades[0]?.price * (100 - bidData.biddingRate)) / 100,
              ord_type: bidData.ord_type,
              inputPrice: bidData.inputPrice,
              biddingRate: bidData.biddingRate,
              askingRate: bidData.askingRate,
            },
          ],
          ask: [
            {
              number: 1,
              price: (+lastpuchaseData?.trades[0]?.price * (100 + bidData.askingRate)) / 100,
              ord_type: bidData.ord_type,
              created_at: '',
              volume: ((bidData.inputPrice / +lastpuchaseData?.trades[0]?.price) * (100 + bidData.askingRate)) / 100,
              inputPrice: bidData.inputPrice,
              biddingRate: bidData.biddingRate,
              askingRate: bidData.askingRate,
            },
          ],
          limit: orderData[0]?.limit,
        },
      };

      setLastpuchaseData(undefined);
      saveOrderReservation(reservationData);
    }
  }, [lastpuchaseData]);
}
