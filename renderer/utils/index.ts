import { I_tickerData } from '../api/interface';
import { I_assetsData } from '../pages/main';

export const getProfitLoss = (assetData: I_assetsData, tickerData: I_tickerData[]) => {
  const totalData = {
    'KRW-BTC': [],
    'KRW-ETH': [],
    'KRW-XRP': [],
  };

  for (let key of Object.keys(totalData)) {
    totalData[key] = assetData[key].bid.map(
      (item) =>
        +((tickerData[tickerData.findIndex((v) => v.market === key)].trade_price - +item.price) * +item.volume).toFixed(
          2,
        ),
    );
  }

  return totalData;
};
