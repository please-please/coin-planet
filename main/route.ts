import { ipcMain } from 'electron';
import {
  API_REQ_GET_COIN_CURRENT_PRICE,
  API_REQ_GET_PURCHASE_DATA,
  API_REQ_ORDER_COIN,
  API_RES_COIN_CURRENT_PRICE_RETURN,
  API_RES_GET_PURCHASE_DATA,
  API_RES_ORDER_COIN,
  ASSETS_RETURN,
  FAIL,
  GET_SAVED_ASSETS_DATA_FILE,
  GET_SAVED_RESERVATION_ORDER_DATA_FILE,
  GET_SAVED_USER_DATA_FILE,
  GET_TOKEN,
  ORDER_FIRST,
  ORDER_RESERVATION,
  REPLY,
  RESERVATION_ORDER_RETURN,
  SAVE_FILE,
  SUCCESS,
  TOKEN_RETURN,
  USER_DATA_RETURN,
} from '../constants';
import { CoinService } from './service/coin-service';
import { sign } from 'jsonwebtoken';
import { v4 } from 'uuid';
import * as queryEncode from 'querystring';
import crypto from 'crypto';
import * as fs from 'fs';

export class Routes {
  constructor(private coinServcie: CoinService) {}
  eventRegister() {
    ipcMain.on(SAVE_FILE, async (evt, arg) => {
      if (arg.accessKey === '' || arg.secretKey === '') {
        evt.sender.send(REPLY, { status: FAIL });
        return;
      }

      const result = await this.coinServcie.saveUserData(arg);
      if (!result) {
        evt.sender.send(REPLY, { status: FAIL });
        return;
      }

      evt.sender.send(REPLY, { status: SUCCESS });
    });
    ipcMain.on(GET_SAVED_USER_DATA_FILE, (evt, arg) => {
      const dataFilePath = `${__dirname}/private_user_data.json`;

      const userData = fs.readFileSync(dataFilePath, 'utf8');
      if (userData === '') {
        evt.sender.send(USER_DATA_RETURN, { status: FAIL });
        return;
      }
      evt.sender.send(USER_DATA_RETURN, { status: SUCCESS, userData: JSON.parse(userData) });
    });

    ipcMain.on(ORDER_FIRST, (evt, arg) => {
      const dataFilePath = `${__dirname}/assets_data.json`;
      const isAssetsData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

      const newAssetsData = {
        ...isAssetsData,
        ...arg,
      };

      const assetsData = JSON.stringify(newAssetsData, null, 2);
      fs.writeFileSync(dataFilePath, assetsData, 'utf8');
    });

    ipcMain.on(GET_SAVED_ASSETS_DATA_FILE, (evt, arg) => {
      const dataFilePath = `${__dirname}/assets_data.json`;
      const assetsData = fs.readFileSync(dataFilePath, 'utf8');

      if (assetsData === '') {
        evt.sender.send(ASSETS_RETURN, { status: FAIL });
        return;
      }
      evt.sender.send(ASSETS_RETURN, { status: SUCCESS, assetsData: JSON.parse(assetsData) });
    });

    ipcMain.on(GET_SAVED_RESERVATION_ORDER_DATA_FILE, (evt, arg) => {
      const dataFilePath = `${__dirname}/reservation_order_data.json`;

      const reservationOrderData = fs.readFileSync(dataFilePath, 'utf8');
      if (reservationOrderData === '') {
        evt.sender.send(RESERVATION_ORDER_RETURN, { status: FAIL });
        return;
      }
      evt.sender.send(RESERVATION_ORDER_RETURN, {
        status: SUCCESS,
        reservationOrderData: JSON.parse(reservationOrderData),
      });
    });

    ipcMain.on(ORDER_RESERVATION, (evt, arg) => {
      const dataFilePath = `${__dirname}/reservation_order_data.json`;
      const isReservationData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

      const newReservationData = {
        ...isReservationData,
        ...arg,
      };
      const reservationOrderData = JSON.stringify(newReservationData, null, 2);
      fs.writeFileSync(dataFilePath, reservationOrderData, 'utf8');
      evt.sender.send(RESERVATION_ORDER_RETURN, { status: SUCCESS });
    });

    ipcMain.on(GET_TOKEN, async (evt, arg) => {
      const dataFilePath = `${__dirname}/private_user_data.json`;
      const userDataFile = fs.readFileSync(dataFilePath, 'utf8');
      const userData = JSON.parse(userDataFile);

      if (userData.accessKey === '' || userData.secretKey === '') {
        evt.sender.send(TOKEN_RETURN, { status: FAIL });
        return;
      }
      // console.log(userData);
      // console.log(arg);
      if (arg.body === undefined) {
        const payload = {
          access_key: userData.accessKey,
          nonce: v4(),
        };

        const token = sign(payload, userData.secretKey);

        evt.sender.send(TOKEN_RETURN, { status: SUCCESS, token });
        return;
      }
      const query = queryEncode.encode(arg.body);

      const hash = crypto.createHash('sha512');
      const queryHash = hash.update(query, 'utf-8').digest('hex');

      const payload = {
        access_key: userData.accessKey,
        nonce: v4(),
        query_hash: queryHash,
        query_hash_alg: 'SHA512',
      };

      const token = sign(payload, userData.secretKey);

      evt.sender.send(TOKEN_RETURN, { status: SUCCESS, token, query });
    });

    ipcMain.on(API_REQ_GET_COIN_CURRENT_PRICE, async (evt, arg) => {
      const result = await this.coinServcie.getCoinPrice();
      if ((result.status + '')[0] !== '2') {
        evt.sender.send(API_RES_COIN_CURRENT_PRICE_RETURN, { status: FAIL, data: result.data });
      }
      evt.sender.send(API_RES_COIN_CURRENT_PRICE_RETURN, { status: SUCCESS, data: result.data });
    });

    ipcMain.on(API_REQ_ORDER_COIN, async (evt, arg) => {
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
  }
}
