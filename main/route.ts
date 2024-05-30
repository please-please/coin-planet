import { ipcMain } from 'electron';
import {
  API_REQ_GET_COIN_CURRENT_PRICE,
  API_REQ_GET_PURCHASE_DATA,
  API_REQ_JSON_EXPORT,
  API_REQ_JSON_SAVE,
  API_REQ_ORDER_COIN,
  API_RES_COIN_CURRENT_PRICE_RETURN,
  API_RES_GET_PURCHASE_DATA,
  API_RES_JSON_EXPORT,
  API_RES_JSON_SAVE,
  API_RES_ORDER_COIN,
  ASSETS_RETURN,
  FAIL,
  GET_SAVED_ASSETS_DATA_FILE,
  GET_SAVED_RESERVATION_ORDER_DATA_FILE,
  GET_SAVED_USER_DATA_FILE,
  ORDER_FIRST,
  ORDER_RESERVATION,
  REPLY,
  RESERVATION_ORDER_RETURN,
  SAVE_FILE,
  SUCCESS,
  USER_DATA_RETURN,
} from '../constants';
import { CoinService } from './service/coin-service';
import { I_orderBody } from '../constants/interface';

export class Routes {
  constructor(private coinServcie: CoinService) {}
  eventRegister() {
    ipcMain.on(SAVE_FILE, async (evt, arg) => {
      if (arg.accessKey === '' || arg.secretKey === '') {
        evt.sender.send(REPLY, { status: FAIL });
        return;
      }

      const result = await this.coinServcie.saveJsonData('private_user_data', arg);
      if (!result) {
        evt.sender.send(REPLY, { status: FAIL });
        return;
      }

      evt.sender.send(REPLY, { status: SUCCESS });
    });

    ipcMain.on(GET_SAVED_USER_DATA_FILE, async (evt, arg) => {
      const { data: userData } = await this.coinServcie.getPrivateUserData();

      if (userData === '') {
        evt.sender.send(USER_DATA_RETURN, { status: FAIL, userData: 'fail' });
      }
      evt.sender.send(USER_DATA_RETURN, { status: SUCCESS, userData: userData });
    });

    ipcMain.on(ORDER_FIRST, async (evt, arg) => {
      const { data: assetsData } = await this.coinServcie.getAssetsData();

      const newAssetsData = {
        ...assetsData,
        ...arg,
      };

      await this.coinServcie.saveJsonData('assets_data', newAssetsData);
    });

    ipcMain.on(GET_SAVED_ASSETS_DATA_FILE, async (evt, arg) => {
      const { data: assetsData } = await this.coinServcie.getAssetsData();

      evt.sender.send(ASSETS_RETURN, { status: SUCCESS, assetsData: assetsData });
    });

    ipcMain.on(GET_SAVED_RESERVATION_ORDER_DATA_FILE, async (evt, arg) => {
      const { data: reservationOrderData } = await this.coinServcie.getReservationOrderData();

      evt.sender.send(RESERVATION_ORDER_RETURN, {
        status: SUCCESS,
        reservationOrderData: reservationOrderData,
      });
    });

    ipcMain.on(ORDER_RESERVATION, async (evt, arg) => {
      const { data: isReservationOrderData } = await this.coinServcie.getReservationOrderData();

      const newReservationData = {
        ...isReservationOrderData,
        ...arg,
      };
      await this.coinServcie.saveJsonData('reservation_order_data', newReservationData);
      evt.sender.send(RESERVATION_ORDER_RETURN, { status: SUCCESS });
    });

    ipcMain.on(API_REQ_GET_COIN_CURRENT_PRICE, async (evt, arg) => {
      const result = await this.coinServcie.getCoinPrice();
      if ((result.status + '')[0] !== '2') {
        evt.sender.send(API_RES_COIN_CURRENT_PRICE_RETURN, { status: FAIL, data: result.data });
      }
      evt.sender.send(API_RES_COIN_CURRENT_PRICE_RETURN, { status: SUCCESS, data: result.data });
    });

    ipcMain.on(API_REQ_ORDER_COIN, async (evt: Electron.IpcMainEvent, arg: I_orderBody) => {
      const result = await this.coinServcie.orderCoin(arg);
      if ((result.status + '')[0] !== '2') {
        evt.sender.send(API_RES_ORDER_COIN, { status: FAIL, data: result.data });
      }
      evt.sender.send(API_RES_ORDER_COIN, { status: SUCCESS, data: result.data });
    });

    ipcMain.on(API_REQ_GET_PURCHASE_DATA, async (evt, arg) => {
      const result = await this.coinServcie.getPurchasData(arg);
      if ((result.status + '')[0] !== '2') {
        evt.sender.send(API_RES_GET_PURCHASE_DATA, { status: FAIL, data: result.data });
      }
      evt.sender.send(API_RES_GET_PURCHASE_DATA, { status: SUCCESS, data: result.data });
    });

    ipcMain.on(API_REQ_JSON_EXPORT, async (evt, arg) => {
      const result = await this.coinServcie.downloadJsonData();
      if (!result) {
        evt.sender.send(API_RES_JSON_EXPORT, { status: FAIL, data: result });
        return;
      }
      evt.sender.send(API_RES_JSON_EXPORT, { status: SUCCESS, data: result });
    });

    ipcMain.on(API_REQ_JSON_SAVE, async (evt, arg) => {
      const result = await this.coinServcie.saveInitJsonData(arg);

      if (!result) {
        evt.sender.send(API_RES_JSON_SAVE, { status: FAIL, data: result });
        return;
      }
      evt.sender.send(API_RES_JSON_SAVE, { status: SUCCESS, data: result });
    });
  }
}
