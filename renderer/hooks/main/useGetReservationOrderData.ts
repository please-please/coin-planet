import { useEffect } from 'react';
import electron from 'electron';
import { useRecoilState } from 'recoil';
import { HasAsk, MyReservations } from '../../recoil/atom';
import { FAIL, GET_SAVED_RESERVATION_ORDER_DATA_FILE, RESERVATION_ORDER_RETURN } from '../../../constants';

const ipcRenderer = electron.ipcRenderer;

export const useGetReservationOrderData = () => {
  const [, setReservationData] = useRecoilState(MyReservations);
  const [, setHasAsk] = useRecoilState(HasAsk);

  useEffect(() => {
    ipcRenderer.send(GET_SAVED_RESERVATION_ORDER_DATA_FILE);
    ipcRenderer.once(RESERVATION_ORDER_RETURN, (_, arg) => {
      if (arg.status === FAIL) return alert('차수주문 내역 조회 실패');
      const { reservationOrderData } = arg;
      setReservationData(reservationOrderData);

      const markets = Object.keys(reservationOrderData);
      for (let i = 0; i < markets.length; i++) {
        if (reservationOrderData[markets[i]]?.ask?.length > 0) {
          setHasAsk((pre) => ({ ...pre, [markets[i]]: true }));
        }
      }
    });
  }, []);
};
