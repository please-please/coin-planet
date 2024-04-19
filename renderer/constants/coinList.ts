import { TableColumnsType } from 'antd';

interface DataType {
  key: React.Key;
  name: string;
  market: string;
  price: number;
}
export const columns: TableColumnsType<DataType> = [
  {
    title: 'Name',
    dataIndex: 'name',
  },
  {
    title: 'Symbol',
    dataIndex: 'symbol',
  },
  {
    title: 'Price',
    dataIndex: 'price',
  },
];

export const coinList: DataType[] = [
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
];
