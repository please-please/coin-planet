import { TableColumnsType } from 'antd';

export interface I_coinListItem {
  name: string;
  market: string;
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
    name: '비트코인',
    market: 'KRW-BTC',
  },
  {
    name: '이더리움',
    market: 'KRW-ETH',
  },
  {
    name: '리플',
    market: 'KRW-XRP',
  },
  {
    name: '도지',
    market: 'KRW-DOGE',
  },
  {
    name: '솔라나',
    market: 'KRW-SOL',
  },
];
