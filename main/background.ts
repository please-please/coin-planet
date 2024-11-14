import { app } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import { CoinService } from './service/coin-service';
import { WINDOW_ALL_CLOSED } from '../constants';
import { CoinRepository } from './repository/coin-repository';
import { Routes } from './route';

const isProd: boolean = process.env.NODE_ENV === 'development' ? false : true;
const coinRepository = new CoinRepository();
const coinService = new CoinService(coinRepository);
const route = new Routes(coinService);
route.eventRegister();

const currentPrice = {
  'KRW-BTC': 0,
  'KRW-ETH': 0,
  'KRW-XRP': 0,
  'KRW-DOGE': 0,
};

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')}`);
}

const autoMonitoring = () => {
  setInterval(async () => {
    const { data } = await coinService.getCoinPrice();

    currentPrice['KRW-BTC'] = data[0].trade_price;
    currentPrice['KRW-ETH'] = data[1].trade_price;
    currentPrice['KRW-XRP'] = data[2].trade_price;
    currentPrice['KRW-DOGE'] = data[3].trade_price;

    const { data: orderData } = await coinService.getReservationOrderData();

    const btcData = orderData['KRW-BTC'];
    const ethData = orderData['KRW-ETH'];
    const xrpData = orderData['KRW-XRP'];
    const dogeData = orderData['KRW-DOGE'];

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

    if (dogeData.bid.length && dogeData.bid[0].price >= currentPrice['KRW-DOGE']) {
      await coinService.autoMonitoringBidOrder(orderData, currentPrice, 'KRW-DOGE');
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

    if (dogeData.ask.length && dogeData.ask[dogeData.ask.length - 1].price <= currentPrice['KRW-DOGE']) {
      await coinService.autoMonitoringAskOrder(orderData, currentPrice, 'KRW-DOGE');
    }
  }, 1000);
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
    } else {
      const port = process.argv[2];
      await mainWindow.loadURL(`http://localhost:${port}/apply`);
      mainWindow.webContents.openDevTools();
    }
  } else {
    if (isProd) {
      await mainWindow.loadURL('app://./main.html');
    } else {
      const port = process.argv[2];
      await mainWindow.loadURL(`http://localhost:${port}/main`);
      mainWindow.webContents.openDevTools();
    }
  }

  autoMonitoring();
})();

app.on(WINDOW_ALL_CLOSED, () => {
  app.quit();
});
