import React, { useEffect, useState } from 'react';
import { TableColumnsType, Table, Typography, Button } from 'antd';
import { useRecoilValue } from 'recoil';
import { MyAssets } from '../../recoil/atom';
import { I_assetBid } from '../../recoil/interface';
import { coinList } from '../../constants/coinList';
import { getProfitLoss } from '../../utils';
import { useGetAssetData, useGetCoinPrice } from '../../hooks';

const isProd: boolean = process.env.NODE_ENV === 'production';

interface I_tableData {
  key: React.Key;
  market: string;
  name: string;
  label?: string;
  profitLossComparedPreviousDay?: number;
  totalProfitLoss: number;
  profitLoss?: number[];
  [key: string]: any;
}

interface I_tableSource extends I_tableData {
  [key: string]: React.Key | string | number | number[];
}

export interface I_assetsData {
  [symbol: string]: {
    bid: I_assetBid[];
  };
}

function Main() {
  const [tableData, setTableData] = useState<I_tableData[]>(TABLE_DEFAULT_DATA);
  const [tableSource, setTableSource] = useState<I_tableSource[]>();
  const [columns, setColumns] = useState<TableColumnsType<I_tableData>>(TABLE_DEFAULT_COLUMNS);
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

  // tableData 세팅
  useEffect(() => {
    if (coinPrice.isFetched && assetData.isFetched) {
      setIsFetched(true);
    }
  }, [coinPrice.isFetched, assetData.isFetched]);

  useEffect(() => {
    if (assetData.isFetched && coinPrice.isFetched) {
      const profitLoss = getProfitLoss(myAssets, coinPrice.tickerData);
      let newTableData = tableData.map((item, i) => {
        const { prev_closing_price, change, change_price } = coinPrice.tickerData[i];
        const yinyang = change === 'FALL' ? -1 : 1;

        return {
          ...item,
          totalProfitLoss: 0,
          label: `${item.name}(${item.market})`,
          profitLossComparedPreviousDay: +((change_price / prev_closing_price) * yinyang * 100).toFixed(2),
          profitLoss: profitLoss[item.market],
        };
      });

      console.log('newTableData', newTableData);

      setTableData(newTableData);
    }
  }, [coinPrice.tickerData, myAssets]);

  // tableColumn 세팅
  useEffect(() => {
    if (tableData.length > 0 && isFetched) {
      const newTableSource = [...tableData];
      const newTableColumn = [...columns];
      for (let i = 0; i < tableData.length; i++) {
        if (tableData[i].profitLoss?.length) {
          for (let j = 0; j < tableData[i].profitLoss.length; j++) {
            newTableSource[i][`profitLoss${j + 1}`] = tableData[i].profitLoss[j];

            if (newTableColumn.findIndex((v) => v.title === `${j + 1}차수 손익`) < 0) {
              newTableColumn.push({
                title: `${j + 1}차수 손익`,
                dataIndex: `profitLoss${j + 1}`,
                className: 'numeric_value',
                width: 100,
                render: (number) =>
                  number !== undefined ? (
                    <p style={{ color: `${number > 0 ? 'red' : number < 0 ? 'blue' : 'black'}` }}>{`${number}원`}</p>
                  ) : null,
              });

              if (i === tableData.length - 1 && j === tableData[i].profitLoss.length - 1) {
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
        if (newTableSource[i].profitLoss?.length)
          newTableSource[i].totalProfitLoss = +newTableSource[i].profitLoss.reduce((p, c) => p + c, 0).toFixed(2);
      }

      setColumns(newTableColumn);
      setTableSource(newTableSource);
      console.log('newTableSource', newTableSource);
    }
  }, [tableData]);

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

const TABLE_DEFAULT_DATA: I_tableData[] = coinList.map((v) => ({
  key: v.key,
  market: v.market,
  name: v.name,
  totalProfitLoss: 0,
}));

const TABLE_DEFAULT_COLUMNS: TableColumnsType<I_tableData> = [
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
    render: (number) =>
      number !== undefined ? (
        <p style={{ color: `${number > 0 ? 'red' : number < 0 ? 'blue' : 'black'}` }}>{`${number}원`}</p>
      ) : null,
  },
];
