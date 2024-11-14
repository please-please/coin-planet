import { dialog } from 'electron';
import { I_orderArg, I_orderBody } from '../../constants/interface';
import { CoinRepository } from '../repository/coin-repository';
import * as fs from 'fs';
import * as archiver from 'archiver';
import * as unzipper from 'unzipper';
import * as path from 'path';

export class CoinService {
  constructor(private coinRepository: CoinRepository) {}
  async autoMonitoringBidOrder(orderData: any, currentPrice: any, symbol: string) {
    if (orderData[symbol].bid[0].number === orderData[symbol].bid[0].limit) {
      console.log('마지막 차수');
      return;
    }

    const body: I_orderBody = {
      market: symbol,
      side: 'bid',
      volume: (orderData[symbol].bid[0].inputPrice / currentPrice[symbol]).toFixed(8),
      price:
        Number((currentPrice[symbol] + '')[0]) + 1 + '0'.repeat((currentPrice[symbol] + '').split('.')[0].length - 1),
      ord_type: 'limit',
    };

    // 매수 하고
    const { data } = await this.coinRepository.orderCoin(body);

    setTimeout(async () => {
      const res = await this.getPurchasData({ uuid: data.uuid });
      const price = Number(res.data.trades[0].price);

      const { data: assetsData } = await this.coinRepository.getJsonData('assets_data');
      const biddingRate = assetsData[symbol].bid[0].biddingRate;
      const askingRate = assetsData[symbol].bid[0].askingRate;

      // assets_data.json에 차수 별 매매 데이터 추가
      const newAssetsData = {
        inputPrice: orderData[symbol].bid[0].inputPrice,
        ord_type: 'limit',
        biddingRate: biddingRate,
        askingRate: askingRate,
        number: orderData[symbol].bid[0].number,
        price: price, // 내가 구매한 금액
        volume: data.volume, // 내가 구매한 수량
        created_at: data.created_at,
      };

      assetsData[symbol].bid.push(newAssetsData);
      await this.coinRepository.writeJsonData('assets_data', assetsData);

      // 매매기록 저장
      // await this.coinRepository.writeJsonData('trade_history', 'dfd');

      let nextOrderFlag = true;
      if (assetsData[symbol].limit <= orderData[symbol].bid[0].number) {
        // 마지막 차수까지 매수 된거임
        nextOrderFlag = false;
      }

      if (nextOrderFlag) {
        const newOrderData = {
          number: orderData[symbol].bid[0].number + 1,
          price: +price * (100 - biddingRate) * 0.01,
          ord_type: 'limit',
          inputPrice: orderData[symbol].bid[0].inputPrice,
        };

        orderData[symbol].bid.push(newOrderData);
      }
      const newAskOrderData = {
        number: orderData[symbol].ask[orderData[symbol].ask.length - 1].number + 1,
        price: price * (100 + askingRate) * 0.01,
        ord_type: 'limit',
        createdAt: '',
        volume: data.volume,
        inputPrice: orderData[symbol].ask[orderData[symbol].ask.length - 1].inputPrice,
      };

      // 매도는 새로 추가
      orderData[symbol].ask.push(newAskOrderData);

      // 제일 앞에꺼 빼고
      const beforeBidData = orderData[symbol].bid.shift();
      if (!orderData[symbol]['beforeData']) {
        orderData[symbol]['beforeData'] = [];
      }

      orderData[symbol]['beforeData'].push(beforeBidData);

      await this.coinRepository.writeJsonData(`reservation_order_data`, orderData);
      return;
    }, 700);
  }

  async autoMonitoringAskOrder(orderData: any, currentPrice: any, symbol: string) {
    if (orderData[symbol].ask[orderData[symbol].ask.length - 1].number === 1) {
      if (symbol !== 'KRW-DOGE') {
        return;
      }
      const body: any = {
        market: symbol,
        side: 'ask',
        volume: orderData[symbol].ask[orderData[symbol].ask.length - 1].volume,
        price:
          Number((currentPrice[symbol] + '')[0]) - 1 + '0'.repeat((currentPrice[symbol] + '').split('.')[0].length - 1),
        ord_type: 'limit',
      };

      // 매도 하고
      try {
        const { data } = await this.coinRepository.orderCoin(body);
      } catch (error) {
        console.log('error', error.message);
      }

      // orderData.symbol.bid = [];
      // orderData.symbol.ask = [];

      const bidBody: I_orderBody = {
        market: symbol,
        side: 'bid',
        volume: (orderData[symbol].bid[0].inputPrice / currentPrice[symbol]).toFixed(8),
        price:
          Number((currentPrice[symbol] + '')[0]) + 1 + '0'.repeat((currentPrice[symbol] + '').split('.')[0].length - 1),
        ord_type: 'limit',
      };

      // // 매수 하고
      try {
        const { data: newData } = await this.coinRepository.orderCoin(bidBody);

        setTimeout(async () => {
          const res = await this.getPurchasData({ uuid: newData.uuid });
          const price = Number(res.data.trades[0].price);

          const { data: assetsData } = await this.coinRepository.getJsonData('assets_data');
          const biddingRate = assetsData[symbol].bid[0].biddingRate;
          const askingRate = assetsData[symbol].bid[0].askingRate;

          // assets_data.json에 차수 별 매매 데이터 추가
          const newAssetsData = {
            inputPrice: orderData[symbol].bid[0].inputPrice,
            ord_type: 'limit',
            biddingRate: biddingRate,
            askingRate: askingRate,
            number: 1,
            price: price, // 내가 구매한 금액
            volume: newData.volume, // 내가 구매한 수량
            created_at: newData.created_at,
          };

          assetsData[symbol].bid.push(newAssetsData);
          await this.coinRepository.writeJsonData('assets_data', assetsData);

          // 매매기록 저장
          // await this.coinRepository.writeJsonData('trade_history', 'dfd');

          const newOrderData = {
            number: 2,
            price: +price * (100 - biddingRate) * 0.01,
            ord_type: 'limit',
            inputPrice: orderData[symbol].bid[0].inputPrice,
          };

          orderData[symbol].bid = [newOrderData];

          const newAskOrderData = {
            number: 1,
            price: price * (100 + askingRate) * 0.01,
            ord_type: 'limit',
            createdAt: '',
            volume: newData.volume,
            inputPrice: orderData[symbol].ask[orderData[symbol].ask.length - 1].inputPrice,
          };

          // 매도는 새로 추가
          orderData[symbol].ask = [newAskOrderData];
          await this.coinRepository.writeJsonData(`reservation_order_data`, orderData);
          return;
        }, 700);
      } catch (error) {
        console.log('error', error.message);
      }

      return;
    }
    const body: any = {
      market: symbol,
      side: 'ask',
      volume: orderData[symbol].ask[orderData[symbol].ask.length - 1].volume,
      price:
        Number((currentPrice[symbol] + '')[0]) - 1 + '0'.repeat((currentPrice[symbol] + '').split('.')[0].length - 1),
      ord_type: 'limit',
    };

    // 매수 하고
    const { data } = await this.coinRepository.orderCoin(body);

    setTimeout(async () => {
      const res = await this.getPurchasData({ uuid: data.uuid });
      const price = Number(res.data.trades[0].price);

      const { filePath: assetsDataFilePath, data: assetsData } = await this.coinRepository.getJsonData('assets_data');
      const biddingRate = assetsData[symbol].bid[0].biddingRate;
      const askingRate = assetsData[symbol].bid[0].askingRate;
      // assets_data.json에 차수 별 매매 데이터 추가
      const newAssetsData = {
        number: orderData[symbol].ask[orderData[symbol].ask.length - 1].number,
        price: price, // 내가 판 금액
        volume: data.volume, // 내가 판 수량
        biddingRate: biddingRate,
        askingRate: askingRate,
        ord_type: 'limit',
        created_at: data.created_at,
      };

      assetsData[symbol].ask.push(newAssetsData);
      await this.coinRepository.writeJsonData('assets_data', assetsData);

      // 있던 데이터 빼고
      orderData[symbol].ask.pop();

      // 최근 매수 데이터 가져오고
      const beforeBidData = orderData[symbol]['beforeData'].pop();
      orderData[symbol].bid = [beforeBidData];

      await this.coinRepository.writeJsonData(`reservation_order_data`, orderData);

      return;
    }, 700);
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
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  async saveInitJsonData(arg) {
    const extractedPath = process.env.NODE_ENV === 'development' ? `${__dirname}/../` : path.join(__dirname, '../../');

    return Promise.resolve(
      fs
        .createReadStream(arg)
        .pipe(unzipper.Extract({ path: extractedPath }))
        .on('close', () => {
          return true;
        })
        .on('error', (err) => {
          return false;
        })
        .promise(),
    ).then((res) => {
      return true;
    });
  }

  async firstOrderCoin(arg: I_orderArg) {
    const body: I_orderBody = {
      market: arg.market,
      side: arg.side,
      volume: (arg.inputPrice / arg.coinPriceData[arg.market]).toFixed(8),
      price:
        Number((arg.coinPriceData[arg.market] + '')[0]) +
        1 +
        '0'.repeat((arg.coinPriceData[arg.market] + '').split('.')[0].length - 1),
      ord_type: arg.ord_type,
    };

    const { data } = await this.orderCoin(body);
    const res = await this.getPurchasData({ uuid: data.uuid });
    const price = Number(res.data.trades[0].price);

    // const newAssetsData = {
    //   inputPrice: orderData[symbol].bid[0].inputPrice,
    //   ord_type: 'limit',
    //   biddingRate: biddingRate,
    //   askingRate: askingRate,
    //   number: orderData[symbol].bid[0].number,
    //   price: price, // 내가 구매한 금액
    //   volume: data.volume, // 내가 구매한 수량
    //   created_at: data.created_at,
    // };

    // assetsData[symbol].bid.push(newAssetsData);
    // await this.coinRepository.writeJsonData('assets_data', assetsData);
  }

  async allAskingOrder(symbol: string) {
    // 내가 갖고있는 현재 수량 가져와서
    //
  }
}
