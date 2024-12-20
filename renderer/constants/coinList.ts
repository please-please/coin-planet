import { TableColumnsType } from 'antd';

export interface I_coinListItem {
  key: React.Key;
  name: string;
  market: string;
  price?: number | string;
}
export const columns: TableColumnsType<I_coinListItem> = [
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

export const COIN_LIST: I_coinListItem[] = [
  {
    key: '1',
    name: '비트코인',
    market: 'KRW-BTC',
  },
  {
    key: '2',
    name: '이더리움',
    market: 'KRW-ETH',
  },
  {
    key: '3',
    name: '리플',
    market: 'KRW-XRP',
  },
  {
    key: '4',
    name: '도지',
    market: 'KRW-DOGE',
  },
  {
    key: '5',
    name: '솔라나',
    market: 'KRW-SOL',
  },
];
