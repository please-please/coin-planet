import { app } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';

import { WINDOW_ALL_CLOSED } from '../constants';
import { CoinRepository } from './repository/coin-repository';
import { Routes } from './route';
import { storeData } from './store';
import { Service } from './service/service';

const isProd: boolean = process.env.NODE_ENV === 'development' ? false : true;
const coinRepository = new CoinRepository();
const coinService = new Service(coinRepository);
const route = new Routes(coinService);
route.eventRegister();

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')}`);
}

const autoMonitoring = () => {
  setInterval(async () => {
    const { data: settingData } = await coinService.getSettingData();

    if (storeData.privateData) {
      try {
        const { data } = await coinService.getCoinPrice();

        for (let i = 0; i < data.length; i++) {
          const market = data[i].market;

          if (!settingData[market]) {
            continue;
          }

          if (!settingData[market].watching) {
            continue;
          }

          const currentPrice = data[i].trade_price;

          try {
            const { data: orderData } = await coinService.getReservationOrderData({ market: market });
            if (orderData.bid.length && orderData.bid[0].price >= currentPrice) {
              await coinService.autoMonitoringBidOrder(orderData, currentPrice, market);
            }
            if (orderData.ask.length && orderData.ask[orderData.ask.length - 1].price <= currentPrice) {
              await coinService.autoMonitoringAskOrder(orderData, currentPrice, market);
            }
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        const errorData = {
          error: e.message,
          time: new Date(),
        };
        await coinService.saveErrorLog(errorData);
        storeData.changePrivateData();
      }
    }
  }, 2000);
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

    storeData.changePrivateData();
    console.log(storeData.privateData);
  }

  autoMonitoring();
})();

app.on(WINDOW_ALL_CLOSED, () => {
  app.quit();
});
