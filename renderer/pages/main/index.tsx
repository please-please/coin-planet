import React, { useEffect, useRef, useState } from 'react';
import { TableColumnsType, Table, Typography, Button } from 'antd';
import { useRecoilValue } from 'recoil';
import { MyAssets } from '../../recoil/atom';
import { coinList } from '../../constants/coinList';
import { downloadJSON, getProfitLoss, getTotalProfitLoss, uploadJSON } from '../../utils';
import { useGetAssetData, useGetCoinPrice } from '../../hooks';
import { I_coinOrderData } from '../../api/interface';

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

function Main() {
  const [initialTableData, setInitialTableData] = useState<I_initialTableData[]>(DEFAULT_TABLE_DATA);
  const [tableSource, setTableSource] = useState<I_tableSource[]>();
  const [columns, setColumns] = useState<TableColumnsType<I_initialTableData>>(DEFAULT_TABLE_COLUMN);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetched, setIsFetched] = useState<boolean>(false);

  const [totalProfit, setTotalProfit] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const myAssets = useRecoilValue<I_coinOrderData>(MyAssets);

  const coinPrice = useGetCoinPrice();
  const assetData = useGetAssetData();

  const clickUploadHandler = () => {
    inputRef.current.click();
  };

  const reload = async () => {
    setIsFetched(false);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
    assetData.reload();
    coinPrice.reload();
  };

  const changeInputHandler: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = inputRef.current.files[0];
    if (file) {
      const callback = () => {
        reload();
      };
      uploadJSON(file, callback);
    }
  };

  const clickReloadHandler = () => {
    reload()
      .then(() => {
        setIsFetched(true);
      })
      .catch(() => alert('새로고침 실패'));
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

  const totalProfitData = () => {
    const profitLoss = getProfitLoss(myAssets, coinPrice.tickerData);
    const profitValues = Object.values(profitLoss.totalProfit);
    const sumProfit = profitValues.reduce((acc, cur) => acc + cur, 0);
    setTotalProfit(sumProfit);
  };

  const tableSourceSetter = () => {
    const newTableSource = [...initialTableData];
    let newTableColumn = [...columns];

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
          }
          if (i === initialTableData.length - 1 && j === initialTableData[i].profitLoss.length - 1) {
            if (newTableColumn.findIndex((v) => v.title === '전량 매도') < 0)
              newTableColumn.push({
                title: '전량 매도',
                dataIndex: 'sellAll',
                width: '8rem',
                fixed: 'right',
                render: () => <a>전량 매도</a>,
              });
          } else {
            const indexToDelete = newTableColumn.findIndex((v) => v.title === '전량 매도');
            newTableColumn = newTableColumn.filter((_, i) => i !== indexToDelete);
            newTableColumn.push({
              title: '전량 매도',
              dataIndex: 'sellAll',
              width: '8rem',
              fixed: 'right',
              render: () => <a>전량 매도</a>,
            });
          }

          newTableColumn.push({
            title: '실현 손익',
            // totalProfit :
          });
        }
      }
      if (newTableSource[i].profitLoss?.length) {
        newTableSource[i].totalProfitLoss = getTotalProfitLoss(newTableSource[i].profitLoss);
      }

      setColumns(newTableColumn);
      setTableSource(newTableSource);
    }
  };

  useEffect(() => {
    if (coinPrice.isFetched && assetData.isFetched) setIsFetched(true);
  }, [coinPrice.isFetched, assetData.isFetched]);

  useEffect(() => {
    if (isFetched) {
      initialTableDataSetter();
      totalProfitData();
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
      <Typography.Title level={3}>{`전체 손익 : ${totalProfit.toFixed(0)}원`}</Typography.Title>
      <div className="buttons">
        <Button
          style={{ height: '50px' }}
          disabled={!assetData.isFetched}
          type="default"
          onClick={() => downloadJSON()}
          loading={isLoading}
        >
          데이터 다운로드
        </Button>
        <Button style={{ height: '50px' }} type="default" onClick={clickUploadHandler} loading={isLoading}>
          데이터 업로드
        </Button>
        <Button style={{ height: '50px' }} type="primary" onClick={clickReloadHandler} loading={isLoading}>
          새로고침
        </Button>
      </div>
      <Table
        title={() => new Date(coinPrice.tickerData?.[0].timestamp).toLocaleString() + ' 조회 기준'}
        columns={columns}
        dataSource={tableSource}
        scroll={{ x: 1300 }}
        pagination={false}
        bordered
      />
      <input onChange={changeInputHandler} ref={inputRef} className="file_input" type="file" accept=".zip" />
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
