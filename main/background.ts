import { app, ipcMain } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import * as fs from 'fs';
import { v4 } from 'uuid';
import { sign } from 'jsonwebtoken';
import * as queryEncode from 'querystring';
import crypto from 'crypto';
import { getCoinPrice, orderCoin } from './api';
import { CoinService } from './service/coin-service';
import {
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
  WINDOW_ALL_CLOSED,
} from '../constants';
import { CoinRepository } from './repository/coin-repository';

const isProd = process.env.NODE_ENV === 'production';
const coinRepository = new CoinRepository();
const coinService = new CoinService(coinRepository);

const currentPrice = {
  'KRW-BTC': 0,
  'KRW-ETH': 0,
  'KRW-XRP': 0,
};

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

const intervalPrice = () => {
  setInterval(async () => {
    const { data } = await getCoinPrice();
    currentPrice['KRW-BTC'] = data[0].trade_price;
    currentPrice['KRW-ETH'] = data[1].trade_price;
    currentPrice['KRW-XRP'] = data[2].trade_price;

    const orderDataFilePath = `${__dirname}/reservation_order_data.json`;
    const orderDataFile = fs.readFileSync(orderDataFilePath, 'utf8');
    const orderData = JSON.parse(orderDataFile);

    const btcData = orderData['KRW-BTC'];
    const ethData = orderData['KRW-ETH'];
    const xrpData = orderData['KRW-XRP'];

    // reservation_order_data.json에 저장된 가격보다 현재가가 낮거나 같으면 시작
    if (btcData.bid.length && btcData.bid[0].price >= currentPrice['KRW-BTC']) {
      await coinService.autoMonitoringBidOrder(orderData, currentPrice, 'KRW-BTC');
    }

    if (ethData.bid.length && ethData.bid[0].price >= currentPrice['KRW-ETH']) {
      await coinService.autoMonitoringBidOrder(orderData, currentPrice, 'KRW-ETH');
    }

    if (xrpData.bid.length && xrpData.bid[0].price >= currentPrice['KRW-XRP']) {
      await coinService.autoMonitoringBidOrder(orderData, currentPrice, 'KRW-XRP');
    }

    // 매도
    if (btcData.ask.length && btcData.ask[btcData.ask.length - 1].price <= currentPrice['KRW-BTC']) {
      await coinService.autoMonitoringAskOrder(orderData, currentPrice, 'KRW-BTC');
    }

    if (ethData.ask.length && ethData.ask[ethData.ask.length - 1].price <= currentPrice['KRW-ETH']) {
      await coinService.autoMonitoringAskOrder(orderData, currentPrice, 'KRW-ETH');
    }

    if (xrpData.ask.length && xrpData.ask[xrpData.ask.length - 1].price <= currentPrice['KRW-XRP']) {
      await coinService.autoMonitoringAskOrder(orderData, currentPrice, 'KRW-XRP');
    }
  }, 10000);
};

(async () => {
  await app.whenReady();

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
  });

  const { data: userData } = await coinService.getPrivateUserData();

  if (userData.accessKey === '' || userData.secretKey === '') {
    if (isProd) {
      await mainWindow.loadURL('app://./apply.html');
      mainWindow.webContents.openDevTools();
    } else {
      const port = process.argv[2];
      await mainWindow.loadURL(`http://localhost:${port}/apply`);
      mainWindow.webContents.openDevTools();
    }
  } else {
    if (isProd) {
      await mainWindow.loadURL('app://./main.html');
      mainWindow.webContents.openDevTools();
    } else {
      const port = process.argv[2];
      await mainWindow.loadURL(`http://localhost:${port}/main`);
      mainWindow.webContents.openDevTools();
    }
  }

  intervalPrice();
})();

app.on(WINDOW_ALL_CLOSED, () => {
  app.quit();
});

ipcMain.on(SAVE_FILE, (evt, arg) => {
  if (arg.accessKey === '' || arg.secretKey === '') {
    evt.sender.send(REPLY, { status: FAIL });
    return;
  }

  const dataFilePath = `${__dirname}/private_user_data.json`;
  const userData = JSON.stringify(arg, null, 2);

  fs.writeFileSync(dataFilePath, userData, 'utf8');
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
