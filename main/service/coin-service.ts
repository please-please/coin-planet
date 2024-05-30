import { dialog } from 'electron';
import { I_orderBody } from '../../constants/interface';
import { CoinRepository } from '../repository/coin-repository';
import * as fs from 'fs';
import * as archiver from 'archiver';
import * as unzipper from 'unzipper';

export class CoinService {
  constructor(private coinRepository: CoinRepository) {}
  async autoMonitoringBidOrder(orderData: any, currentPrice: any, symbol: string) {
    if (orderData.bid.length && orderData.bid[0].price >= currentPrice[symbol]) {
      if (orderData.bid[0].number === orderData.bid[0].limit) {
        console.log('마지막 차수');
        return;
      }

      const body: I_orderBody = {
        market: symbol,
        side: 'bid',
        volume: (orderData.bid[0].inputPrice / currentPrice[symbol]).toFixed(8),
        price: Math.ceil(currentPrice[symbol] / 1000) * 1000,
        ord_type: 'limit',
      };

      // 매수 하고
      const { data } = await this.coinRepository.orderCoin(body);

      setTimeout(async () => {
        const res = await this.getPurchasData({ uuid: data.uuid });
        const price = res.data.trades[0].price;

        const { data: assetsData } = await this.coinRepository.getJsonData('assets_data');

        // assets_data.json에 차수 별 매매 데이터 추가
        const newAssetsData = {
          inputPrice: orderData.bid[0].inputPrice,
          ord_type: 'limit',
          biddingRate: 5,
          askingRate: 5,
          number: orderData.bid[0].number,
          price: price, // 내가 구매한 금액
          // volume: data.volume, // 내가 구매한 수량
          created_at: data.created_at,
        };

        assetsData[symbol].bid.push(newAssetsData);
        await this.coinRepository.writeJsonData('assets_data', assetsData);

        let nextOrderFlag = true;
        if (assetsData[symbol].limit <= orderData.bid[0].number) {
          // 마지막 차수까지 매수 된거임
          nextOrderFlag = false;
        }

        if (nextOrderFlag) {
          const newOrderData = {
            number: orderData.bid[0].number + 1,
            price: +price * (100 - 5) * 0.01,
            ord_type: 'limit',
            inputPrice: orderData.bid[0].inputPrice,
          };

          const newAskOrderData = {
            number: orderData.ask[orderData.ask.length - 1].number + 1,
            price: +price * (100 + 5) * 0.01,
            ord_type: 'limit',
            createdAt: '',
            volume: data.volume,
            inputPrice: orderData.ask[orderData.ask.length - 1].inputPrice,
          };

          orderData[symbol].bid.push(newOrderData);

          // 매도는 새로 추가
          orderData[symbol].ask.push(newAskOrderData);
        }

        // 제일 앞에꺼 빼고
        orderData[symbol].bid.shift();

        await this.coinRepository.writeJsonData(`reservation_order_data`, orderData);
        return;
      }, 500);
    }
  }

  async autoMonitoringAskOrder(orderData: any, currentPrice: any, symbol: string) {
    if (orderData.ask[orderData.ask.length - 1].number === 1) {
      console.log('일단 첫번째 차수는 매도 안되게 설정');
      return;
    }
    const body: any = {
      market: symbol,
      side: 'ask',
      volume: orderData.ask[orderData.ask.length - 1].volume,
      price: Math.floor(currentPrice[symbol] / 1000) * 1000,
      ord_type: 'limit',
    };

    // 매수 하고
    const { data } = await this.coinRepository.orderCoin(body);

    setTimeout(async () => {
      const res = await this.getPurchasData({ uuid: data.uuid });
      const price = res.data.trades[0].price;

      const { filePath: assetsDataFilePath, data: assetsData } = await this.coinRepository.getJsonData('assets_data');

      // assets_data.json에 차수 별 매매 데이터 추가
      const newAssetsData = {
        number: orderData.ask[orderData.ask.length - 1].number,
        price: price, // 내가 판 금액
        volume: data.volume, // 내가 판 수량
        biddingRate: 5,
        askingRate: 5,
        ord_type: 'limit',
        created_at: data.created_at,
      };

      assetsData[symbol].ask.push(newAssetsData);
      await this.coinRepository.writeJsonData(assetsDataFilePath, assetsData);

      // 있던 데이터 빼고
      orderData[symbol].ask.pop();

      await this.coinRepository.writeJsonData(`reservation_order_data.json`, orderData);

      return;
    }, 500);
  }

  async getCoinPrice() {
    return await this.coinRepository.getCoinPrice();
  }

  async getPrivateUserData() {
    return await this.coinRepository.getJsonData('private_user_data');
  }

  async saveJsonData(name: string, arg) {
    return await this.coinRepository.writeJsonData(name, arg);
  }

  async orderCoin(arg) {
    return await this.coinRepository.orderCoin(arg);
  }

  async getPurchasData(arg: { uuid: string }) {
    return await this.coinRepository.getPurchasData(arg);
  }

  async getAssetsData() {
    return await this.coinRepository.getJsonData('assets_data');
  }

  async getReservationOrderData() {
    return await this.coinRepository.getJsonData('reservation_order_data');
  }

  async downloadJsonData() {
    const { data: assetsData } = await this.getAssetsData();
    const { data: reservationOrderData } = await this.getReservationOrderData();
    const { data: privateUserData } = await this.getPrivateUserData();
    try {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Save compressed file',
        defaultPath: 'out.zip',
        filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
      });

      const files = [
        { name: 'assets_data.json', content: JSON.stringify(assetsData) },
        { name: 'reservation_order_data.json', content: JSON.stringify(reservationOrderData) },
        { name: 'private_user_data.json', content: JSON.stringify(privateUserData) },
      ];

      if (filePath) {
        const outputStream = fs.createWriteStream(filePath);
        const archive = archiver.create('zip', { zlib: { level: 9 } });

        outputStream.on('close', function () {
          console.log(archive.pointer() + ' total bytes');
          console.log('Archiver has been finalized and the output file descriptor has closed.');
        });

        archive.pipe(outputStream);

        files.forEach((file) => {
          archive.append(file.content, { name: file.name });
        });

        await archive.finalize();
      }
    } catch (e) {
      return false;
    }
  }

  async saveInitJsonData(arg) {
    try {
      // const beforeAssetsData = JSON.parse(arg.assetsData);
      // const beforeReservationOrderData = JSON.parse(arg.reservationOrderData);
      // const beforePrivateUserData = JSON.parse(arg.privateUserData);
      // await this.saveJsonData('assets_data', beforeAssetsData);
      // await this.saveJsonData('reservation_order_data', beforeReservationOrderData);
      // await this.saveJsonData('private_user_data', beforePrivateUserData);

      // const { filePaths: outputDir } = await dialog.showOpenDialog({
      //   title: 'Select directory to extract to',
      //   properties: ['openDirectory', 'createDirectory'],
      // });

      // if (outputDir && outputDir.length > 0) {
      //   fs.createReadStream(zipPath)
      //     .pipe(unzipper.Extract({ path: outputDir[0] }))
      //     .on('close', () => {
      //       console.log('Extraction complete.');
      //     })
      //     .on('error', (err) => {
      //       console.error('Extraction error:', err);
      //     });
      //   return true;
      // }
      return true;
    } catch (e) {
      return false;
    }
  }
}
