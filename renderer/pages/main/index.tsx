import React, { useEffect, useState } from 'react';
import { TableColumnsType, Table, Typography, Button } from 'antd';
import { useRecoilValue } from 'recoil';
import { MyAssets } from '../../recoil/atom';
import { I_assetBid } from '../../recoil/interface';
import { coinList } from '../../constants/coinList';
import { getProfitLoss, getTotalProfitLoss } from '../../utils';
import { useGetAssetData, useGetCoinPrice } from '../../hooks';

const isProd: boolean = process.env.NODE_ENV === 'production';

interface I_initialTableData {
  key: React.Key;
  market: string;
  name: string;
  label?: string;
  profitLossComparedPreviousDay?: number;
  totalProfitLoss?: [number, number];
  profitLoss?: number[];
  [key: string]: React.Key | string | number | number[];
}

interface I_tableSource extends I_initialTableData {
  [key: string]: React.Key | string | number | number[];
}

export interface I_assetsData {
  [symbol: string]: {
    bid: I_assetBid[];
  };
}

function Main() {
  const [initialTableData, setInitialTableData] = useState<I_initialTableData[]>(DEFAULT_TABLE_DATA);
  const [tableSource, setTableSource] = useState<I_tableSource[]>();
  const [columns, setColumns] = useState<TableColumnsType<I_initialTableData>>(DEFAULT_TABLE_COLUMN);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetched, setIsFetched] = useState<boolean>(false);

  const myAssets = useRecoilValue<I_assetsData>(MyAssets);

  const coinPrice = useGetCoinPrice();
  const assetData = useGetAssetData();

  const reload = async () => {
    setIsFetched(false);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
    assetData.reload();
    coinPrice.reload();
  };

  const clickReloadHandler = () => {
    reload()
      .then(() => {
        setIsFetched(true);
      })
      .catch((e) => alert('새로고침 실패'));
  };

  const initialTableDataSetter = () => {
    const profitLoss = getProfitLoss(myAssets, coinPrice.tickerData);
    let newTableData = initialTableData.map((item, i) => {
      const { prev_closing_price, change, change_price } = coinPrice.tickerData[i];
      const yinyang = change === 'FALL' ? -1 : 1;

      return {
        ...item,
        label: `${item.name}(${item.market})`,
        profitLossComparedPreviousDay: +((change_price / prev_closing_price) * yinyang * 100).toFixed(2),
        profitLoss: profitLoss[item.market],
      };
    });

    setInitialTableData(newTableData);
  };

  const tableSourceSetter = () => {
    const newTableSource = [...initialTableData];
    const newTableColumn = [...columns];
    for (let i = 0; i < initialTableData.length; i++) {
      if (initialTableData[i].profitLoss?.length) {
        for (let j = 0; j < initialTableData[i].profitLoss.length; j++) {
          newTableSource[i][`profitLoss${j + 1}`] = initialTableData[i].profitLoss[j];

          if (newTableColumn.findIndex((v) => v.title === `${j + 1}차수 손익`) < 0) {
            newTableColumn.push({
              title: `${j + 1}차수 손익`,
              dataIndex: `profitLoss${j + 1}`,
              className: 'numeric_value',
              width: 100,
              render: (tuple) =>
                tuple !== undefined ? (
                  <p
                    style={{ color: `${tuple[0] > 0 ? 'red' : tuple[0] < 0 ? 'blue' : 'black'}` }}
                  >{`${(+tuple[0]).toLocaleString()}원 (${(+tuple[1]).toLocaleString()}%)`}</p>
                ) : null,
            });

            if (i === initialTableData.length - 1 && j === initialTableData[i].profitLoss.length - 1) {
              if (newTableColumn.findIndex((v) => v.title === '전량 매도') < 0)
                newTableColumn.push({
                  title: '전량 매도',
                  dataIndex: 'sellAll',
                  width: '8rem',
                  fixed: 'right',
                  render: () => <a>전량 매도</a>,
                });
            }
          }
        }
      }
      if (newTableSource[i].profitLoss?.length) {
        newTableSource[i].totalProfitLoss = getTotalProfitLoss(newTableSource[i].profitLoss, coinPrice.tickerData[i]);
      }

      setColumns(newTableColumn);
      setTableSource(newTableSource);
    }
  };

  useEffect(() => {
    if (coinPrice.isFetched && assetData.isFetched) {
      setIsFetched(true);
    }
  }, [coinPrice.isFetched, assetData.isFetched]);

  useEffect(() => {
    if (isFetched) {
      initialTableDataSetter();
    }
  }, [isFetched]);

  useEffect(() => {
    if (initialTableData.length > 0 && isFetched) {
      tableSourceSetter();
    }
  }, [initialTableData]);

  return (
    <React.Fragment>
      <Typography.Title level={2}>종목손익</Typography.Title>
      <Button
        style={{ float: 'right', height: '50px', marginBottom: '1rem' }}
        type="primary"
        onClick={clickReloadHandler}
        loading={isLoading}
      >
        새로고침
      </Button>
      <Table
        title={() => new Date(coinPrice.tickerData?.[0].timestamp).toLocaleString() + ' 조회 기준'}
        columns={columns}
        dataSource={tableSource}
        scroll={{ x: 1300 }}
        pagination={false}
        bordered
      />
    </React.Fragment>
  );
}

export default Main;

const DEFAULT_TABLE_DATA: I_initialTableData[] = coinList.map((v) => ({
  key: v.key,
  market: v.market,
  name: v.name,
}));

const DEFAULT_TABLE_COLUMN: TableColumnsType<I_initialTableData> = [
  {
    title: '종목이름',
    dataIndex: 'label',
    fixed: 'left',
    width: '10rem',
  },
  {
    title: '전일대비 등락률',
    dataIndex: 'profitLossComparedPreviousDay',
    className: 'numeric_value',
    width: 100,
    render: (number) => (
      <p style={{ color: `${number > 0 ? 'red' : number < 0 ? 'blue' : 'black'}` }}>{`${number}%`}</p>
    ),
  },
  {
    title: '전체 손익',
    dataIndex: 'totalProfitLoss',
    className: 'numeric_value',
    width: 100,
    render: (tuple) =>
      tuple !== undefined ? (
        <p
          style={{ color: `${tuple[0] > 0 ? 'red' : tuple[0] < 0 ? 'blue' : 'black'}` }}
        >{`${(+tuple[0]).toLocaleString()}원 (${(+tuple[1]).toLocaleString()}%)`}</p>
      ) : null,
  },
];
