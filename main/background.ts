import path from 'path';
import { app, ipcMain } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import * as fs from 'fs';
import axios from 'axios';

import { v4 } from 'uuid';
import { sign } from 'jsonwebtoken';
import * as queryEncode from 'querystring';
import crypto from 'crypto';
import { getCoinPrice, orderCoin } from './api';
const isProd = process.env.NODE_ENV === 'production';

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

    // const a = await axios.get(`https://api.upbit.com/v1/ticker?markets=KRW-BTC,KRW-ETH,KRW-XRP`);
    // currentPrice['KRW-BTC'] = data[0].trade_price;
    currentPrice['KRW-ETH'] = data[1].trade_price;
    currentPrice['KRW-XRP'] = data[2].trade_price;
    // currentPrice['KRW-BTC'] = 85065000;
    currentPrice['KRW-BTC'] = data[0].trade_price;
    // const aaa = data[0].trade_price;

    // currentPrice['KRW-ETH'] = 4000000;
    // currentPrice['KRW-XRP'] = 800;
    // console.log(currentPrice);

    const orderDataFilePath = `${__dirname}/reservation_order_data.json`;
    const orderDataFile = fs.readFileSync(orderDataFilePath, 'utf8');
    const orderData = JSON.parse(orderDataFile);

    const btcData = orderData['KRW-BTC'];
    const ethData = orderData['KRW-ETH'];
    const xrpData = orderData['KRW-XRP'];

    // reservation_order_data.json에 저장된 가격보다 현재가가 낮거나 같으면 시작
    if (btcData.bid.length && btcData.bid[0].price >= currentPrice['KRW-BTC']) {
      if (btcData.bid[0].number === btcData.bid[0].limit) {
        console.log('마지막 차수');
        return;
      }

      const body: any = {
        market: 'KRW-BTC',
        side: 'bid',
        price: Math.ceil(currentPrice['KRW-BTC'] / 1000) * 1000,
        ord_type: 'limit',
        volume: (btcData.bid[0].inputPrice / currentPrice['KRW-BTC']).toFixed(8),
      };

      // 매수 하고
      const { data } = await orderCoin(body);

      const assetsDataFilePath = `${__dirname}/assets_data.json`;
      const assetsDataFile = fs.readFileSync(assetsDataFilePath, 'utf8');
      const assetsData = JSON.parse(assetsDataFile);

      // assets_data.json에 차수 별 매매 데이터 추가
      const newAssetsData = {
        number: btcData.bid[0].number,
        price: data.price, // 내가 구매한 금액
        volume: data.volume, // 내가 구매한 수량
        ord_type: 'limit',
        created_at: data.created_at,
      };

      assetsData['KRW-BTC'].bid.push(newAssetsData);
      fs.writeFileSync(assetsDataFilePath, JSON.stringify(assetsData), 'utf8');

      let nextOrderFlag = true;
      if (btcData.limit <= btcData.bid[0].number) {
        // 마지막 차수까지 매수 된거임
        nextOrderFlag = false;
      }

      if (nextOrderFlag) {
        const newOrderData = {
          number: btcData.bid[0].number + 1,
          market: btcData.bid[0].market,
          side: 'bid',
          price: data.price,
          ord_type: 'limit',
          inputPrice: btcData.bid[0].inputPrice,
        };

        orderData['KRW-BTC'].bid.push(newOrderData);
      }

      // 제일 앞에꺼 빼고
      orderData['KRW-BTC'].bid.shift();

      fs.writeFileSync(orderDataFilePath, JSON.stringify(orderData), 'utf8');
    }
  }, 10000);
};

(async () => {
  await app.whenReady();

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
  });
  const userDataFilePath = `${__dirname}/private_user_data.json`;
  const userDataFile = fs.readFileSync(userDataFilePath, 'utf8');
  const userData = JSON.parse(userDataFile);
  if (userData.accessKey === '' || userData.secretKey === '') {
    if (isProd) {
      await mainWindow.loadURL('app://./apply');
    } else {
      const port = process.argv[2];
      await mainWindow.loadURL(`http://localhost:${port}/apply`);
      mainWindow.webContents.openDevTools();
    }
  } else {
    if (isProd) {
      await mainWindow.loadURL('app://./home');
    } else {
      const port = process.argv[2];
      await mainWindow.loadURL(`http://localhost:${port}/main`);
      mainWindow.webContents.openDevTools();
    }
  }

  intervalPrice();
})();

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`);
});

ipcMain.on('saveFile', (evt, arg) => {
  if (arg.accessKey === '' || arg.secretKey === '') {
    evt.sender.send('reply', { status: 'fail' });
    return;
  }

  const dataFilePath = `${__dirname}/private_user_data.json`;
  const userData = JSON.stringify(arg, null, 2);

  fs.writeFileSync(dataFilePath, userData, 'utf8');
  evt.sender.send('reply', { status: 'success' });
});

ipcMain.on('getSavedUserDataFile', (evt, arg) => {
  const dataFilePath = `${__dirname}/private_user_data.json`;

  const userData = fs.readFileSync(dataFilePath, 'utf8');
  if (userData === '') {
    evt.sender.send('userDataReturn', { status: 'fail' });
    return;
  }
  evt.sender.send('userDataReturn', { status: 'success', userData: JSON.parse(userData) });
});

ipcMain.on('orderFirst', (evt, arg) => {
  const dataFilePath = `${__dirname}/assets_data.json`;
  const isAssetsData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

  const newAssetsData = {
    ...isAssetsData,
    ...arg,
  };

  const assetsData = JSON.stringify(newAssetsData, null, 2);
  fs.writeFileSync(dataFilePath, assetsData, 'utf8');
});

ipcMain.on('getSavedAssetsDataFile', (evt, arg) => {
  const dataFilePath = `${__dirname}/assets_data.json`;
  const assetsData = fs.readFileSync(dataFilePath, 'utf8');

  if (assetsData === '') {
    evt.sender.send('assetsReturn', { status: 'fail' });
    return;
  }
  evt.sender.send('assetsReturn', { status: 'success', assetsData: JSON.parse(assetsData) });
});

ipcMain.on('getSavedReservationOrderDataFile', (evt, arg) => {
  const dataFilePath = `${__dirname}/reservation_order_data.json`;

  const reservationOrderData = fs.readFileSync(dataFilePath, 'utf8');
  if (reservationOrderData === '') {
    evt.sender.send('reservationOrderReturn', { status: 'fail' });
    return;
  }
  evt.sender.send('reservationOrderReturn', {
    status: 'success',
    reservationOrderData: JSON.parse(reservationOrderData),
  });
});

ipcMain.on('orderReservation', (evt, arg) => {
  const dataFilePath = `${__dirname}/reservation_order_data.json`;
  const isReservationData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

  const newReservationData = {
    ...isReservationData,
    ...arg,
  };
  const reservationOrderData = JSON.stringify(newReservationData, null, 2);
  fs.writeFileSync(dataFilePath, reservationOrderData, 'utf8');
  evt.sender.send('reservationOrderReturn', { status: 'success' });
});

ipcMain.on('getToken', async (evt, arg) => {
  const dataFilePath = `${__dirname}/private_user_data.json`;
  const userDataFile = fs.readFileSync(dataFilePath, 'utf8');
  const userData = JSON.parse(userDataFile);

  if (userData.accessKey === '' || userData.secretKey === '') {
    evt.sender.send('tokenReturn', { status: 'fail' });
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

    evt.sender.send('tokenReturn', { status: 'success', token });
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

  evt.sender.send('tokenReturn', { status: 'success', token, query });
});
