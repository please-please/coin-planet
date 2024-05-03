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

const isProd = process.env.NODE_ENV === 'production';

const coinService = new CoinService();

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
      // if (btcData.bid[0].number === btcData.bid[0].limit) {
      //   console.log('마지막 차수');
      //   return;
      // }
      // const body: any = {
      //   market: 'KRW-BTC',
      //   side: 'bid',
      //   price: Math.ceil(currentPrice['KRW-BTC'] / 1000) * 1000,
      //   ord_type: 'limit',
      //   volume: (btcData.bid[0].inputPrice / currentPrice['KRW-BTC']).toFixed(8),
      // };
      // // 매수 하고
      // const { data } = await orderCoin(body);
      // const assetsDataFilePath = `${__dirname}/assets_data.json`;
      // const assetsDataFile = fs.readFileSync(assetsDataFilePath, 'utf8');
      // const assetsData = JSON.parse(assetsDataFile);
      // // assets_data.json에 차수 별 매매 데이터 추가
      // const newAssetsData = {
      //   number: btcData.bid[0].number,
      //   price: data.price, // 내가 구매한 금액
      //   volume: data.volume, // 내가 구매한 수량
      //   ord_type: 'limit',
      //   created_at: data.created_at,
      // };
      // assetsData['KRW-BTC'].bid.push(newAssetsData);
      // fs.writeFileSync(assetsDataFilePath, JSON.stringify(assetsData), 'utf8');
      // let nextOrderFlag = true;
      // if (btcData.limit <= btcData.bid[0].number) {
      //   // 마지막 차수까지 매수 된거임
      //   nextOrderFlag = false;
      // }
      // if (nextOrderFlag) {
      //   const newOrderData = {
      //     number: btcData.bid[0].number + 1,
      //     market: btcData.bid[0].market,
      //     side: 'bid',
      //     price: data.price,
      //     ord_type: 'limit',
      //     inputPrice: btcData.bid[0].inputPrice,
      //   };
      //   const newAskOrderData = {
      //     number: btcData.ask[btcData.ask.length - 1].number + 1,
      //     side: 'ask',
      //     price: +data.price * (100 + 5) * 0.01,
      //     ord_type: 'limit',
      //     volume: data.volume,
      //     inputPrice: btcData.ask[btcData.ask.length - 1].inputPrice,
      //   };
      //   orderData['KRW-BTC'].bid.push(newOrderData);
      //   // 매도는 새로 추가
      //   orderData['KRW-BTC'].ask.push(newAskOrderData);
      // }
      // // 제일 앞에꺼 빼고
      // orderData['KRW-BTC'].bid.shift();
      // fs.writeFileSync(orderDataFilePath, JSON.stringify(orderData), 'utf8');
    }

    if (ethData.bid.length && ethData.bid[0].price >= currentPrice['KRW-ETH']) {
      await coinService.autoMonitoringBidOrder(orderData, currentPrice, 'KRW-ETH');
      // if (ethData.bid[0].number === ethData.bid[0].limit) {
      //   console.log('마지막 차수');
      //   return;
      // }
      // const body: any = {
      //   market: 'KRW-ETH',
      //   side: 'bid',
      //   price: Math.ceil(currentPrice['KRW-ETH'] / 1000) * 1000,
      //   ord_type: 'limit',
      //   volume: (ethData.bid[0].inputPrice / currentPrice['KRW-ETH']).toFixed(8),
      // };
      // // 매수 하고
      // const { data } = await orderCoin(body);
      // const assetsDataFilePath = `${__dirname}/assets_data.json`;
      // const assetsDataFile = fs.readFileSync(assetsDataFilePath, 'utf8');
      // const assetsData = JSON.parse(assetsDataFile);
      // // assets_data.json에 차수 별 매매 데이터 추가
      // const newAssetsData = {
      //   number: ethData.bid[0].number,
      //   price: data.price, // 내가 구매한 금액
      //   volume: data.volume, // 내가 구매한 수량
      //   ord_type: 'limit',
      //   created_at: data.created_at,
      // };
      // assetsData['KRW-ETH'].bid.push(newAssetsData);
      // fs.writeFileSync(assetsDataFilePath, JSON.stringify(assetsData), 'utf8');
      // let nextOrderFlag = true;
      // if (ethData.limit <= ethData.bid[0].number) {
      //   // 마지막 차수까지 매수 된거임
      //   nextOrderFlag = false;
      // }
      // if (nextOrderFlag) {
      //   const newOrderData = {
      //     number: ethData.bid[0].number + 1,
      //     market: ethData.bid[0].market,
      //     side: 'bid',
      //     price: data.price,
      //     ord_type: 'limit',
      //     inputPrice: ethData.bid[0].inputPrice,
      //   };
      //   const newAskOrderData = {
      //     number: ethData.ask[ethData.ask.length - 1].number + 1,
      //     side: 'ask',
      //     price: +data.price * (100 + 5) * 0.01,
      //     ord_type: 'limit',
      //     volume: data.volume,
      //     inputPrice: ethData.ask[ethData.ask.length - 1].inputPrice,
      //   };
      //   orderData['KRW-ETH'].bid.push(newOrderData);
      //   // 매도는 새로 추가
      //   orderData['KRW-ETH'].ask.push(newAskOrderData);
      // }
      // // 제일 앞에꺼 빼고
      // orderData['KRW-ETH'].bid.shift();
      // fs.writeFileSync(orderDataFilePath, JSON.stringify(orderData), 'utf8');
    }

    if (xrpData.bid.length && xrpData.bid[0].price >= currentPrice['KRW-XRP']) {
      await coinService.autoMonitoringBidOrder(orderData, currentPrice, 'KRW-XRP');
      // if (xrpData.bid[0].number === xrpData.bid[0].limit) {
      //   console.log('마지막 차수');
      //   return;
      // }
      // const body: any = {
      //   market: 'KRW-XRP',
      //   side: 'bid',
      //   price: Math.ceil(currentPrice['KRW-XRP'] / 1000) * 1000,
      //   ord_type: 'limit',
      //   volume: (xrpData.bid[0].inputPrice / currentPrice['KRW-XRP']).toFixed(8),
      // };
      // // 매수 하고
      // const { data } = await orderCoin(body);
      // const assetsDataFilePath = `${__dirname}/assets_data.json`;
      // const assetsDataFile = fs.readFileSync(assetsDataFilePath, 'utf8');
      // const assetsData = JSON.parse(assetsDataFile);
      // // assets_data.json에 차수 별 매매 데이터 추가
      // const newAssetsData = {
      //   number: xrpData.bid[0].number,
      //   price: data.price, // 내가 구매한 금액
      //   volume: data.volume, // 내가 구매한 수량
      //   ord_type: 'limit',
      //   created_at: data.created_at,
      // };
      // assetsData['KRW-XRP'].bid.push(newAssetsData);
      // fs.writeFileSync(assetsDataFilePath, JSON.stringify(assetsData), 'utf8');
      // let nextOrderFlag = true;
      // if (xrpData.limit <= xrpData.bid[0].number) {
      //   // 마지막 차수까지 매수 된거임
      //   nextOrderFlag = false;
      // }
      // if (nextOrderFlag) {
      //   const newOrderData = {
      //     number: xrpData.bid[0].number + 1,
      //     market: xrpData.bid[0].market,
      //     side: 'bid',
      //     price: data.price,
      //     ord_type: 'limit',
      //     inputPrice: xrpData.bid[0].inputPrice,
      //   };
      //   orderData['KRW-XRP'].bid.push(newOrderData);
      // }
      // const newAskOrderData = {
      //   number: xrpData.ask[xrpData.ask.length - 1].number + 1,
      //   side: 'ask',
      //   price: +data.price * (100 + 5) * 0.01,
      //   ord_type: 'limit',
      //   volume: data.volume,
      //   inputPrice: xrpData.ask[xrpData.ask.length - 1].inputPrice,
      // };
      // // 제일 앞에꺼 빼고
      // orderData['KRW-XRP'].bid.shift();
      // // 매도는 새로 추가
      // orderData['KRW-XRP'].ask.push(newAskOrderData);
      // fs.writeFileSync(orderDataFilePath, JSON.stringify(orderData), 'utf8');
    }

    // 매도
    if (btcData.ask.length && btcData.ask[btcData.ask.length - 1].price <= currentPrice['KRW-BTC']) {
      if (btcData.ask[btcData.ask.length - 1].number === 1) {
        console.log('일단 첫번째 차수는 매도 안되게 설정');
        return;
      }
      const body: any = {
        market: 'KRW-BTC',
        side: 'ask',
        price: Math.floor(currentPrice['KRW-BTC'] / 1000) * 1000,
        ord_type: 'limit',
        volume: btcData.ask[btcData.ask.length - 1].volume,
      };

      // 매도 하고
      const { data } = await orderCoin(body);

      const assetsDataFilePath = `${__dirname}/assets_data.json`;
      const assetsDataFile = fs.readFileSync(assetsDataFilePath, 'utf8');
      const assetsData = JSON.parse(assetsDataFile);

      // assets_data.json에 차수 별 매매 데이터 추가
      const newAssetsData = {
        number: btcData.ask[btcData.ask.length - 1].number,
        price: data.price, // 내가 판 금액
        volume: data.volume, // 내가 판 수량
        ord_type: 'limit',
        created_at: data.created_at,
      };

      assetsData['KRW-BTC'].ask.push(newAssetsData);
      fs.writeFileSync(assetsDataFilePath, JSON.stringify(assetsData), 'utf8');

      // 있던 데이터 빼고
      orderData['KRW-BTC'].ask.pop();

      fs.writeFileSync(orderDataFilePath, JSON.stringify(orderData), 'utf8');
    }

    if (ethData.ask.length && ethData.ask[ethData.ask.length - 1].price <= currentPrice['KRW-ETH']) {
      if (ethData.ask[ethData.ask.length - 1].number === 1) {
        console.log('일단 첫번째 차수는 매도 안되게 설정');
        return;
      }
      const body: any = {
        market: 'KRW-BTC',
        side: 'ask',
        price: Math.floor(currentPrice['KRW-BTC'] / 1000) * 1000,
        ord_type: 'limit',
        volume: ethData.ask[ethData.ask.length - 1].volume,
      };

      // 매도 하고
      const { data } = await orderCoin(body);

      const assetsDataFilePath = `${__dirname}/assets_data.json`;
      const assetsDataFile = fs.readFileSync(assetsDataFilePath, 'utf8');
      const assetsData = JSON.parse(assetsDataFile);

      // assets_data.json에 차수 별 매매 데이터 추가
      const newAssetsData = {
        number: ethData.ask[ethData.ask.length - 1].number,
        price: data.price, // 내가 판 금액
        volume: data.volume, // 내가 판 수량
        ord_type: 'limit',
        created_at: data.created_at,
      };

      assetsData['KRW-ETH'].ask.push(newAssetsData);
      fs.writeFileSync(assetsDataFilePath, JSON.stringify(assetsData), 'utf8');

      // 있던 데이터 빼고
      orderData['KRW-ETH'].ask.pop();

      fs.writeFileSync(orderDataFilePath, JSON.stringify(orderData), 'utf8');
    }

    if (xrpData.ask.length && xrpData.ask[xrpData.ask.length - 1].price <= currentPrice['KRW-XRP']) {
      if (xrpData.ask[xrpData.ask.length - 1].number === 1) {
        console.log('일단 첫번째 차수는 매도 안되게 설정');
        return;
      }
      const body: any = {
        market: 'KRW-BTC',
        side: 'ask',
        price: Math.floor(currentPrice['KRW-BTC'] / 1000) * 1000,
        ord_type: 'limit',
        volume: xrpData.ask[xrpData.ask.length - 1].volume,
      };

      // 매도 하고
      const { data } = await orderCoin(body);

      const assetsDataFilePath = `${__dirname}/assets_data.json`;
      const assetsDataFile = fs.readFileSync(assetsDataFilePath, 'utf8');
      const assetsData = JSON.parse(assetsDataFile);

      // assets_data.json에 차수 별 매매 데이터 추가
      const newAssetsData = {
        number: xrpData.ask[xrpData.ask.length - 1].number,
        price: data.price, // 내가 판 금액
        volume: data.volume, // 내가 판 수량
        ord_type: 'limit',
        created_at: data.created_at,
      };

      assetsData['KRW-XRP'].ask.push(newAssetsData);
      fs.writeFileSync(assetsDataFilePath, JSON.stringify(assetsData), 'utf8');

      // 있던 데이터 빼고
      orderData['KRW-XRP'].ask.pop();

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

app.on(WINDOW_ALL_CLOSED, () => {
  app.quit();
});

// ipcMain.on('message', async (event, arg) => {
//   event.reply('message', `${arg} World!`);
// });

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
