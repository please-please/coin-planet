import * as fs from 'fs';
import { orderCoin } from '../api';

export class CoinService {
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
      const { data } = await orderCoin(body);

      const assetsDataFilePath = `${__dirname}/assets_data.json`;
      const assetsDataFile = fs.readFileSync(assetsDataFilePath, 'utf8');
      const assetsData = JSON.parse(assetsDataFile);

      // assets_data.json에 차수 별 매매 데이터 추가
      const newAssetsData = {
        number: orderData.bid[0].number,
        price: data.price, // 내가 구매한 금액
        volume: data.volume, // 내가 구매한 수량
        ord_type: 'limit',
        created_at: data.created_at,
      };

      assetsData[symbol].bid.push(newAssetsData);
      fs.writeFileSync(assetsDataFilePath, JSON.stringify(assetsData), 'utf8');

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
          price: data.price,
          ord_type: 'limit',
          inputPrice: orderData.bid[0].inputPrice,
        };

        const newAskOrderData = {
          number: orderData.ask[orderData.ask.length - 1].number + 1,
          side: 'ask',
          price: +data.price * (100 + 5) * 0.01,
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

      fs.writeFileSync(`${__dirname}/reservation_order_data.json`, JSON.stringify(orderData), 'utf8');
      return;
    }
  }

  async autoMonitoringAskOrder(orderData: any, currentPrice: any, symbol: string) {}
}
