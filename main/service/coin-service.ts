import { CoinRepository } from '../repository/coin-repository';

export class CoinService {
  constructor(private coinRepository: CoinRepository) {}
  async autoMonitoringBidOrder(orderData: any, currentPrice: any, symbol: string) {
    if (orderData.bid.length && orderData.bid[0].price >= currentPrice[symbol]) {
      if (orderData.bid[0].number === orderData.bid[0].limit) {
        console.log('마지막 차수');
        return;
      }

      const body: any = {
        market: symbol,
        side: 'bid',
        price: Math.ceil(currentPrice[symbol] / 1000) * 1000,
        ord_type: 'limit',
        volume: (orderData.bid[0].inputPrice / currentPrice[symbol]).toFixed(8),
      };

      // 매수 하고
      const { data } = await this.coinRepository.orderCoin(body);
      const res = await this.getPurchasData({ uuid: data.uuid });
      const price = res.data.trades[0].price;

      const { data: assetsData } = await this.coinRepository.getJsonData('assets_data');

      // assets_data.json에 차수 별 매매 데이터 추가
      const newAssetsData = {
        number: orderData.bid[0].number,
        price: price, // 내가 구매한 금액
        volume: data.volume, // 내가 구매한 수량
        ord_type: 'limit',
        created_at: data.created_at,
      };

      assetsData[symbol].bid.push(newAssetsData);
      await this.coinRepository.writeJsonData('assets_data', assetsData);

      let nextOrderFlag = true;
      if (orderData.limit <= orderData.bid[0].number) {
        // 마지막 차수까지 매수 된거임
        nextOrderFlag = false;
      }

      if (nextOrderFlag) {
        const newOrderData = {
          number: orderData.bid[0].number + 1,
          market: orderData.bid[0].market,
          side: 'bid',
          price: +price * (100 - 5) * 0.01,
          ord_type: 'limit',
          inputPrice: orderData.bid[0].inputPrice,
        };

        const newAskOrderData = {
          number: orderData.ask[orderData.ask.length - 1].number + 1,
          side: 'ask',
          price: +price * (100 + 5) * 0.01,
          ord_type: 'limit',
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
      price: Math.floor(currentPrice[symbol] / 1000) * 1000,
      ord_type: 'limit',
      volume: orderData.ask[orderData.ask.length - 1].volume,
    };

    // 매수 하고
    const { data } = await this.coinRepository.orderCoin(body);
    const res = await this.getPurchasData({ uuid: data.uuid });
    const price = res.data.trades[0].price;

    const { filePath: assetsDataFilePath, data: assetsData } = await this.coinRepository.getJsonData('assets_data');

    // assets_data.json에 차수 별 매매 데이터 추가
    const newAssetsData = {
      number: orderData.ask[orderData.ask.length - 1].number,
      price: price, // 내가 판 금액
      volume: data.volume, // 내가 판 수량
      ord_type: 'limit',
      created_at: data.created_at,
    };

    assetsData[symbol].ask.push(newAssetsData);
    await this.coinRepository.writeJsonData(assetsDataFilePath, assetsData);

    // 있던 데이터 빼고
    orderData[symbol].ask.pop();

    await this.coinRepository.writeJsonData(`reservation_order_data.json`, orderData);

    return;
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
}
