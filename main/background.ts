import path from 'path';
import { app, ipcMain } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import * as fs from 'fs';
import axios from 'axios';
import { getCoinPrice, orderCoin } from '../renderer/api/api';
import { v4 } from 'uuid';
import { sign } from 'jsonwebtoken';
import * as queryEncode from 'querystring';
import crypto from 'crypto';
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

// const intervalPrice = () => {
//   setInterval(async () => {
//     const { data } = await getCoinPrice();
//     currentPrice['KRW-BTC'] = data[0].trade_price;
//     currentPrice['KRW-ETH'] = data[1].trade_price;
//     currentPrice['KRW-XRP'] = data[2].trade_price;

//     const orderDataFilePath = `${__dirname}/reservation_order_data.json`;
//     const orderDataFile = fs.readFileSync(orderDataFilePath, 'utf8');
//     const orderData = JSON.parse(orderDataFile);

//     // orderData
//     for (let i = 0; i < orderData?.bid?.length; i++) {
//       if (currentPrice[orderData.bid[i].symbol] <= orderData.bid[i].price) {
//         console.log('매수 주문');

//         const orderCoinData = {
//           limit: orderData.bid[i].limit,
//           symbol: orderData.bid[i].symbol,
//           minus: 5,
//           plus: 5,
//           totalMoney: orderData.bid[i].totalMoney,
//           side: 'bid',
//         };
//         const { data } = await orderCoin(orderCoinData);

//         const dataFilePath = `${__dirname}/assets_data.json`;
//         const assetsDataFile = fs.readFileSync(dataFilePath, 'utf8');
//         const assetsData = JSON.parse(assetsDataFile);
//         const newAssetsData = [
//           ...assetsData,
//           {
//             limit: orderData.bid[i].limit,
//             symbol: orderData.bid[i].symbol,
//             price: data.price,
//             totalMoney: orderData.bid[i].totalMoney,
//           },
//         ];
//       }
//     }

//     for (let i = orderData?.ask?.length - 1; i >= 0; i--) {
//       if (currentPrice[orderData.ask[i].symbol] >= orderData.ask[i].price) {
//         console.log('매도 주문');
//       }
//     }
//   }, 1000);
// };

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
      await mainWindow.loadURL(`http://localhost:${port}/home`);
      mainWindow.webContents.openDevTools();
    }
  }

  // intervalPrice();
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
  const assetsData = JSON.stringify(arg, null, 2);
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
  const reservationOrderData = JSON.stringify(arg, null, 2);
  fs.writeFileSync(dataFilePath, reservationOrderData, 'utf8');
});

ipcMain.on('getToken', async (evt, arg) => {
  const dataFilePath = `${__dirname}/private_user_data.json`;
  const userDataFile = fs.readFileSync(dataFilePath, 'utf8');
  const userData = JSON.parse(userDataFile);
  if (arg.body === undefined) {
    const payload = {
      access_key: userData.accessKey,
      nonce: v4(),
    };

    const token = sign(payload, userData.secretKey);

    evt.sender.send('tokenReturn', { status: 'success', token });
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

  evt.sender.send('tokenReturn', { status: 'success', token });
});
