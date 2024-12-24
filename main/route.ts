import { ipcMain } from 'electron';
import {
  CHANGE_BOOSTING,
  CHANGE_BOOSTING_RETURN,
  CHANGE_WATCHING,
  CHANGE_WATCHING_RETURN,
  FAIL,
  GET_COIN_LIST,
  GET_COIN_LIST_RETURN,
  GET_CURRENT_PRICE,
  GET_CURRENT_PRICE_RETURN,
  GET_ORDER_DATA,
  GET_ORDER_DATA_RETURN,
  GET_PURCHASE_DATA_LOG,
  GET_PURCHASE_DATA_LOG_RETURN,
  GET_SAVED_USER_DATA_FILE,
  GET_SETTING,
  GET_SETTING_RETURN,
  ORDER_BID,
  ORDER_BID_RETURN,
  RESET_ALL_DATA,
  RESET_ALL_DATA_RETURN,
  RESET_PURCHASE_DATA,
  RESET_PURCHASE_DATA_RETURN,
  SAVE_FILE,
  SAVE_FILE_RETURN,
  SET_COIN_SETTING,
  SET_COIN_SETTING_RETURN,
  SUCCESS,
  USER_DATA_RETURN,
} from '../constants';

import { Service } from './service/service';
import { orderArg, settingArg, settingDataType } from './interface';

export class Routes {
  constructor(private service: Service) {}
  eventRegister() {
    ipcMain.on(GET_SAVED_USER_DATA_FILE, async (evt, arg) => {
      const { data: userData } = await this.service.getPrivateUserData();

      if (userData === '') {
        evt.sender.send(USER_DATA_RETURN, { status: FAIL, userData: 'fail' });
      }
      evt.sender.send(USER_DATA_RETURN, { status: SUCCESS, userData: userData });
    });
    // 코인 별 세팅하기
    ipcMain.on(SET_COIN_SETTING, async (evt, arg: settingArg) => {
      const result = await this.service.setCoinSetting(arg);
      evt.sender.send(SET_COIN_SETTING_RETURN, result);
    });

    // 주문하기 (매수)
    // 이건 무조건 1차수 밖에 없음. 티커만 보내면 끝
    // ex) arg = { market: 'KRW-BTC', inputPrice: 1000000, limit : 10 }
    ipcMain.on(ORDER_BID, async (evt, arg: orderArg) => {
      console.log(arg);
      const result = await this.service.order(arg);
      evt.sender.send(ORDER_BID_RETURN, result);
    });

    // 실시간 감시 기능 on/off
    ipcMain.on(CHANGE_WATCHING, async (evt, arg: settingArg) => {
      const result = await this.service.changeWatching(arg);
      evt.sender.send(CHANGE_WATCHING_RETURN, result);
    });

    // 부스팅 기능 (1차 매도 후 재매수) on/off
    ipcMain.on(CHANGE_BOOSTING, async (evt, arg: settingArg) => {
      const result = await this.service.changeBoosting(arg);
      evt.sender.send(CHANGE_BOOSTING_RETURN, result);
    });

    // 코인 세팅 불러오기
    ipcMain.on(GET_SETTING, async (evt, arg) => {
      const result = await this.service.getSetting();
      evt.sender.send(GET_SETTING_RETURN, result);
    });

    // 현재가 조회하기 && 업비트 연결 테스트
    ipcMain.on(GET_CURRENT_PRICE, async (evt, arg: string[]) => {
      const result = await this.service.getCurrentPrice(arg);
      evt.sender.send(GET_CURRENT_PRICE_RETURN, result);
    });

    // 로그 raw data 조회하기 && 구매내역 조회하기
    ipcMain.on(GET_PURCHASE_DATA_LOG, async (evt, arg: settingArg) => {
      const result = await this.service.getPurchaseData(arg);
      evt.sender.send(GET_PURCHASE_DATA_LOG_RETURN, result);
    });

    // 자동매도 데이터 불러오기
    ipcMain.on(GET_ORDER_DATA, async (evt, arg: settingArg) => {
      const result = await this.service.getOrderData(arg);
      evt.sender.send(GET_ORDER_DATA_RETURN, result);
    });

    // 키값 저장하기
    ipcMain.on(SAVE_FILE, async (evt, arg) => {
      if (arg.accessKey === '' || arg.secretKey === '') {
        evt.sender.send(SAVE_FILE_RETURN, { status: FAIL });
        return;
      }
      const result = await this.service.saveJsonData('private_user_data', arg);
      if (!result) {
        evt.sender.send(SAVE_FILE_RETURN, { status: FAIL });
        return;
      }
      evt.sender.send(SAVE_FILE_RETURN, { status: SUCCESS });
    });

    // 구매내역 초기화하기
    ipcMain.on(RESET_PURCHASE_DATA, async (evt, arg: settingArg) => {
      const result = await this.service.resetPurchaseData(arg);
      evt.sender.send(RESET_PURCHASE_DATA_RETURN, result);
    });

    // 전체 초기화하기
    ipcMain.on(RESET_ALL_DATA, async (evt, arg) => {
      const result = await this.service.resetAllData();
      evt.sender.send(RESET_ALL_DATA_RETURN, result);
    });

    // 코인 리스트 불러오기
    ipcMain.on(GET_COIN_LIST, async (evt, arg) => {
      const result = await this.service.getCoinList();
      evt.sender.send(GET_COIN_LIST_RETURN, result);
    });
  }

  // 주문하기 (일괄매도)

  // 구매내역 엑셀로 저장하기

  // 전체 초기화하기
}
