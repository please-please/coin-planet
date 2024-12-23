import { dialog } from 'electron';
import { I_orderArg, I_orderBody } from '../../constants/interface';
import { CoinRepository } from '../repository/coin-repository';
import * as fs from 'fs';
import * as archiver from 'archiver';
import * as unzipper from 'unzipper';
import * as path from 'path';

import { storeData } from '../store';
import { orderArg, settingArg } from '../interface';

export class Service {
  constructor(private coinRepository: CoinRepository) {}

  async order(arg: orderArg) {
    const { data: isOrderData } = await this.coinRepository.getJsonData(`${arg.market}_order_data`);

    if (isOrderData) {
      return { status: 400, data: { error: '이미 구매한 코인입니다.' } };
    }

    const { data: assetsData } = await this.coinRepository.getJsonData('assets_data');

    const { data: settingData } = await this.coinRepository.getJsonData('setting_data');

    const { data: currentPrice } = await this.getCoinPrice();

    currentPrice.forEach((el) => {
      currentPrice[el.market] = el.trade_price;
    });
    if ((currentPrice[arg.market] + '').length > 4) {
      currentPrice[arg.market] = Math.floor((currentPrice[arg.market] * 1.2) / 10000) * 10000;
    } else {
      currentPrice[arg.market] = currentPrice[arg.market] * 1.2;
    }
    const bidBody: I_orderBody = {
      market: arg.market,
      side: 'bid',
      volume: (arg.inputPrice / currentPrice[arg.market]).toFixed(8),
      price: currentPrice[arg.market],
      ord_type: 'limit',
    };

    try {
      const { data } = await this.coinRepository.orderCoin(bidBody);

      if (data.error) {
        return { status: 400, data };
      }

      await new Promise<void>(async (resolve) => {
        setTimeout(async () => {
          const res = await this.coinRepository.getPurchasData({ uuid: data.uuid });
          const price = Number(res.data.trades[0].price);

          const biddingRate = settingData[arg.market].biddingRate;
          const askingRate = settingData[arg.market].askingRate;

          const id = data.uuid;
          const newAssetsData = {
            id: id,
            symbol: arg.market,
            orderType: 'bid',
            inputPrice: arg.inputPrice,
            biddingRate: biddingRate,
            askingRate: askingRate,
            number: 1,
            price: price,
            volume: data.volume,
            created_at: data.created_at,
          };

          assetsData[arg.market] = { bid: [newAssetsData], ask: [] };

          await this.coinRepository.writeJsonData('assets_data', assetsData);

          const newBidOrderData = {
            id: id,
            number: 2,
            price: +price * (100 - biddingRate) * 0.01,
            ord_type: 'limit',
            inputPrice: arg.inputPrice,
          };

          const newAskOrderData = {
            number: 1,
            price: price * (100 + askingRate) * 0.01,
            ord_type: 'limit',
            createdAt: '',
            volume: data.volume,
            inputPrice: arg.inputPrice,
          };

          const orderData = { bid: [newBidOrderData], ask: [newAskOrderData] };
          await this.coinRepository.writeJsonData(`${arg.market}_order_data`, orderData);
          resolve();
        }, 1000);
      });
      settingData[arg.market].watching = true;
      await this.coinRepository.writeJsonData('setting_data', settingData);
    } catch (e) {
      console.log(e.message);
    }

    return { status: 200 };
  }

  async changeWatching(arg: settingArg) {
    const settingData = await this.coinRepository.getJsonData('setting_data');
    settingData[arg.market].watching = !settingData[arg.market].watching;
    await this.coinRepository.writeJsonData('setting_data', settingData);
    return { status: 200, data: settingData[arg.market].watching };
  }

  async changeBoosting(arg: settingArg) {
    const settingData = await this.coinRepository.getJsonData('setting_data');
    settingData[arg.market].boosting = !settingData[arg.market].boosting;
    await this.coinRepository.writeJsonData('setting_data', settingData);
    return { status: 200, data: settingData[arg.market].boosting };
  }

  async getSetting() {
    const { data: settingData } = await this.coinRepository.getJsonData('setting_data');
    const boosting = storeData.boosting;
    const watching = storeData.watching;

    return { status: 200, data: { boosting, watching, settingData } };
  }

  async getCurrentPrice(arg: string[]) {
    const { data } = await this.coinRepository.getCurrentPrice(arg);

    const result = [];
    data.forEach((el) => {
      result.push({ market: el.market, trade_price: el.trade_price });
    });
    return result;
  }

  async getPurchaseData(arg: settingArg) {
    const { data } = await this.coinRepository.getJsonData('assets_data');
    if (arg.market === 'raw') {
      return { status: 200, data };
    }

    if (arg.market !== 'raw' && data[arg.market]) {
      data[arg.market].bid.sort((a, b) => {
        return b.created_at - a.created_at;
      });
      data[arg.market].ask.sort((a, b) => {
        return b.created_at - a.created_at;
      });
    }
    return data;
  }

  async getOrderData(arg: settingArg) {
    const { data } = await this.coinRepository.getJsonData(`${arg.market}_order_data`);
    return { status: 200, data };
  }

  async autoMonitoringBidOrder(orderData: any, currentPrice: any, market: string) {
    const { data: settingData } = await this.coinRepository.getJsonData('setting_data');
    if (settingData[market].limit <= orderData.bid[0].number) {
      console.log('마지막 차수');
      return;
    }

    const bidBody: I_orderBody = {
      market: market,
      side: 'bid',
      volume: (orderData.bid[0].inputPrice / currentPrice[market]).toFixed(8),
      price: currentPrice[market] * 1.2,
      ord_type: 'limit',
    };

    if (!storeData.watching) {
      return { status: 400, data: { error: 'Watching === false' } };
    }

    const { data: assetsData } = await this.coinRepository.getJsonData('assets_data');

    // true면 false로 바꾸고
    await storeData.changeWatching({ market: market });

    const { data } = await this.coinRepository.orderCoin(bidBody);
    if (data.error) {
      return { status: 400, data };
    }
    await new Promise<void>(async (resolve) => {
      setTimeout(async () => {
        const res = await this.coinRepository.getPurchasData({ uuid: data.uuid });
        const price = Number(res.data.trades[0].price);

        const biddingRate = settingData[market].biddingRate;
        const askingRate = settingData[market].askingRate;

        const id = data.uuid;
        const newAssetsData = {
          id: id,
          symbol: market,
          orderType: 'bid',
          inputPrice: orderData.bid[0].inputPrice,
          biddingRate: biddingRate,
          askingRate: askingRate,
          number: orderData.bid[0].number,
          price: price,
          volume: data.volume,
          created_at: data.created_at,
        };

        assetsData[market].bid.push(newAssetsData);
        await this.coinRepository.writeJsonData('assets_data', assetsData);

        let nextOrderFlag = true;
        if (settingData[market].limit <= orderData.bid[0].number) {
          // 마지막 차수까지 매수 된거임
          nextOrderFlag = false;
        }

        if (nextOrderFlag) {
          const newOrderData = {
            number: orderData.bid[0].number + 1,
            price: +price * (100 - biddingRate) * 0.01,
            ord_type: 'limit',
            inputPrice: orderData.bid[0].inputPrice,
          };

          orderData.bid.push(newOrderData);
        }
        const newAskOrderData = {
          number: orderData.ask[orderData.ask.length - 1].number + 1,
          price: price * (100 + askingRate) * 0.01,
          ord_type: 'limit',
          createdAt: '',
          volume: data.volume,
          inputPrice: orderData.ask[orderData.ask.length - 1].inputPrice,
        };

        orderData.ask.push(newAskOrderData);

        // 제일 앞에꺼 빼고
        const beforeBidData = orderData.bid.shift();
        if (!orderData['beforeData']) {
          orderData['beforeData'] = [];
        }

        orderData['beforeData'].push(beforeBidData);

        await this.coinRepository.writeJsonData(`${market}_order_data`, orderData);
        return;
      }, 1000);
    });

    // 다 끝나면 다시 true로 변경
    await storeData.changeWatching({ market: market });

    return { status: 200, data };
  }

  async autoMonitoringAskOrder(orderData: any, currentPrice: any, market: string) {
    const { data: settingData } = await this.coinRepository.getJsonData('setting_data');
    if (orderData.ask[orderData.ask.length - 1].number === 1) {
      const body: any = {
        market: market,
        side: 'ask',
        volume: orderData.ask[orderData.ask.length - 1].volume,
        price: currentPrice[market] * 1.2,
        ord_type: 'limit',
      };

      if (!storeData.watching) {
        return { status: 400, data: { error: 'Watching === false' } };
      }

      const { data: assetsData } = await this.coinRepository.getJsonData('assets_data');

      // true면 false로 바꾸고
      await storeData.changeWatching({ market: market });

      const { data } = await this.coinRepository.orderCoin(body);

      const bidBody: I_orderBody = {
        market: market,
        side: 'bid',
        volume: (orderData.bid[0].inputPrice / currentPrice[market]).toFixed(8),
        price: currentPrice[market] * 1.2,
        ord_type: 'limit',
      };

      // // 매수 하고
      try {
        const { data: newData } = await this.coinRepository.orderCoin(bidBody);
        await new Promise<void>(async (resolve) => {
          setTimeout(async () => {
            const res = await this.coinRepository.getPurchasData({ uuid: newData.uuid });
            const price = Number(res.data.trades[0].price);

            const biddingRate = settingData[market].biddingRate;
            const askingRate = settingData[market].askingRate;

            // assets_data.json에 차수 별 매매 데이터 추가
            const newAssetsData = {
              inputPrice: orderData.bid[0].inputPrice,
              ord_type: 'limit',
              biddingRate: biddingRate,
              askingRate: askingRate,
              number: 1,
              price: price, // 내가 구매한 금액
              volume: newData.volume, // 내가 구매한 수량
              created_at: newData.created_at,
            };

            assetsData[market].ask.push(newAssetsData);
            await this.coinRepository.writeJsonData('assets_data', assetsData);

            const newOrderData = {
              number: 2,
              price: +price * (100 - biddingRate) * 0.01,
              ord_type: 'limit',
              inputPrice: orderData.bid[0].inputPrice,
            };

            orderData.bid = [newOrderData];

            const newAskOrderData = {
              number: 1,
              price: price * (100 + askingRate) * 0.01,
              ord_type: 'limit',
              createdAt: '',
              volume: newData.volume,
              inputPrice: orderData.ask[orderData.ask.length - 1].inputPrice,
            };

            // 매도는 새로 추가
            orderData.ask = [newAskOrderData];
            await this.coinRepository.writeJsonData(`reservation_order_data`, orderData);
            return;
          }, 1000);
        });
      } catch (error) {
        console.log('error', error.message);
      }
      await storeData.changeWatching({ market: market });

      return { status: 200, data };
    }

    const body: any = {
      market: market,
      side: 'ask',
      volume: orderData.ask[orderData.ask.length - 1].volume,
      price: currentPrice[market] * 0.8,
      ord_type: 'limit',
    };

    const { data } = await this.coinRepository.orderCoin(body);
    await new Promise<void>(async (resolve) => {
      setTimeout(async () => {
        const res = await this.coinRepository.getPurchasData({ uuid: data.uuid });
        const price = Number(res.data.trades[0].price);

        const { data: assetsData } = await this.coinRepository.getJsonData('assets_data');
        const biddingRate = settingData[market].biddingRate;
        const askingRate = settingData[market].askingRate;
        // assets_data.json에 차수 별 매매 데이터 추가
        const newAssetsData = {
          number: orderData.ask[orderData.ask.length - 1].number,
          price: price, // 내가 판 금액
          volume: data.volume, // 내가 판 수량
          biddingRate: biddingRate,
          askingRate: askingRate,
          ord_type: 'limit',
          created_at: data.created_at,
        };

        assetsData[market].ask.push(newAssetsData);
        await this.coinRepository.writeJsonData('assets_data', assetsData);

        // 있던 데이터 빼고
        orderData.ask.pop();

        // 최근 매수 데이터 가져오고
        const beforeBidData = orderData['beforeData'].pop();
        orderData.bid = [beforeBidData];

        await this.coinRepository.writeJsonData(`${market}_order_data`, orderData);

        return;
      }, 1000);
    });

    // 다 끝나면 다시 true로 변경
    await storeData.changeWatching({ market: market });

    return { status: 200, data };
  }

  async saveJsonData(name: string, arg) {
    return await this.coinRepository.writeJsonData(name, arg);
  }

  async resetPurchaseData(arg: settingArg) {
    const { data: assetsData } = await this.coinRepository.getJsonData('assets_data');

    const newAssetsData = delete assetsData[arg.market];

    await this.coinRepository.writeJsonData('assets_data', newAssetsData);
    await this.coinRepository.deleteJsonData(`${arg.market}_order_data`);
  }

  async resetAllData() {
    await this.coinRepository.deleteJsonData('assets_data');
    await this.coinRepository.deleteJsonData('setting_data');
  }

  async setCoinSetting(arg: settingArg) {
    const { data: settingData } = await this.coinRepository.getJsonData('setting_data');
    const data = settingData ? { ...settingData, [arg.market]: arg } : { [arg.market]: arg };

    await this.coinRepository.writeJsonData('setting_data', data);
    return { status: 200, data };
  }

  async getCoinList() {}

  async getCoinPrice() {
    return await this.coinRepository.getCoinPrice();
  }

  async getReservationOrderData(arg: settingArg) {
    return await this.coinRepository.getJsonData(`${arg.market}_order_data`);
  }

  async getPrivateUserData() {
    return await this.coinRepository.getJsonData('private_user_data');
  }

  async getSettingData() {
    return await this.coinRepository.getJsonData('setting_data');
  }

  async saveErrorLog(errorData) {
    return await this.coinRepository.writeJsonData('error_log', errorData);
  }
}
