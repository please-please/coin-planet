import { TableColumnsType } from 'antd';

export interface I_coinData {
  key: React.Key;
  name: string;
  market: string;
  price: number | string;
}
export const columns: TableColumnsType<I_coinData> = [
  {
    title: '종목이름',
    dataIndex: 'name',
  },
  {
    title: '심볼',
    dataIndex: 'market',
  },
  {
    title: '가격',
    dataIndex: 'price',
  },
];

export const coinList: I_coinData[] = [
  {
    key: '1',
    name: '비트코인',
    market: 'KRW-BTC',
    price: 0,
  },
  {
    key: '2',
    name: '이더리움',
    market: 'KRW-ETH',
    price: 0,
  },
  {
    key: '3',
    name: '리또속',
    market: 'KRW-XRP',
    price: 0,
  },
  {
    key: '4',
    name: '도지',
    market: 'KRW-DOGE',
    price: 0,
  },
];
