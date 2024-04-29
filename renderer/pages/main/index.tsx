import React, { useEffect, useState } from 'react';
import { TableColumnsType, Table, Typography, Button } from 'antd';
import { useRecoilState } from 'recoil';
import { MyAssets, MyReservations, MyUserData } from '../../recoil/atom';
import electron from 'electron';
import { getCoinPrice } from '../../api/api';
import { I_tickerData } from '../../api/interface';
import { coinList } from '../../constants/coinList';
import { I_assetBid } from '../../recoil/interface';
import { getProfitLoss } from '../../utils';

const ipcRenderer = electron.ipcRenderer;

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
  const [tickerData, setTickerData] = useState<I_tickerData[]>();
  const [tableData, setTableData] = useState<I_tableData[]>(TABLE_DEFAULT_DATA);
  const [tableSource, setTableSource] = useState<I_tableSource[]>();
  const [columns, setColumns] = useState<TableColumnsType<I_tableData>>(TABLE_DEFAULT_COLUMNS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [myAssets, setMyAssets] = useRecoilState<I_assetsData>(MyAssets);

  // const [myUserData, setMyUserData] = useRecoilState(MyUserData);
  // const [myReservationOrderData, setMyReservationOrderData] = useRecoilState(MyReservations);

  // useEffect(() => {
  //   // 저장되어있는 private user data 불러와서 글로벌에 할당해야함. recoil 쓸까 말까

  //   ipcRenderer.send('getSavedUserDataFile', {});
  //   ipcRenderer.on('reply', (evt, arg) => {
  //     if (arg.status === 'success') {
  //       setMyUserData(arg.userData);
  //       console.log(arg.userData);
  //     }
  //   });

  //   ipcRenderer.send('getSavedAssetsDataFile', {});
  //   ipcRenderer.on('assetsReturn', (evt, arg) => {
  //     if (arg.status === 'success') {
  //       setMyAssets(arg.assetsData);
  //     }
  //     console.log(arg.assetsData);
  //   });

  //   ipcRenderer.send('getSavedReservationOrderDataFile', {});
  //   ipcRenderer.on('reservationOrderReturn', (evt, arg) => {
  //     if (arg.status === 'success') {
  //       setMyReservationOrderData(arg.reservationOrderData);
  //     }
  //     console.log(arg.reservationOrderData);
  //   });
  // }, []);

  const reload = () => {
    // 체결내역 불러와서
    // 추가된 체결내역 있는지 확인하고
    // 있으면 추가된 체결내역을 assetsData에 추가하고
    // myAssets에 추가할당하고
    // 현재가 불러와서
    // myAssets에 있는 것들 수익률 계산하고
    // 화면 렌더링
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
    ipcRenderer.send('getSavedAssetsDataFile');
    getCoinPrice()
      .then((res) => {
        setTickerData(res.data);
      })
      .catch(() => alert('조회 오류!'));
  };

  useEffect(() => {
    ipcRenderer.send('getSavedAssetsDataFile');
    ipcRenderer.once('assetsReturn', (_, arg) => {
      // console.log('에셋리턴');
      if (arg.status === 'success') {
        setMyAssets(arg.assetsData);
      }
      // return ipcRenderer.removeAllListeners('assetsReturn');
    });
  }, []);

  useEffect(() => {
    getCoinPrice()
      .then((res) => {
        console.log(res.data);
        setTickerData(res.data);
      })
      .catch(() => alert('조회 오류!'));
  }, []);

  useEffect(() => {
    if (Object.keys(myAssets).length > 0 && tickerData?.length > 0) {
      const profitLoss = getProfitLoss(myAssets, tickerData);
      let newTableData = tableData.map((item, i) => {
        const { prev_closing_price, change, change_price } = tickerData[i];
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

      //   // 전체손익, 각 차수별 손익 계산
      //   // Myassets에서 토큰별 비드 값에서 volume * price -> 구매한 토큰 원화가격
      //   //
      // }

      setTableData(newTableData);
    }
  }, [tickerData, myAssets]);

  useEffect(() => {
    if (tableData.length > 0) {
      const newTableSource = [...tableData];
      const newTableColumn = [...columns];
      for (let i = 0; i < tableData.length; i++) {
        if (tableData[i].profitLoss?.length) {
          for (let j = 0; j < tableData[i].profitLoss?.length; j++) {
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
            }
          }
          if (newTableColumn.findIndex((v) => v.title === '전량 매도') < 0)
            newTableColumn.push({
              title: '전량 매도',
              dataIndex: 'sellAll',
              width: '8rem',
              fixed: 'right',
              render: () => <a>전량 매도</a>,
            });
        }
        if (newTableSource[i].profitLoss?.length)
          newTableSource[i].totalProfitLoss = newTableSource[i].profitLoss.reduce((p, c) => p + c, 0);
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
        onClick={reload}
        loading={isLoading}
      >
        새로고침
      </Button>
      <Table
        title={() => new Date(tickerData?.[0].timestamp).toLocaleString() + ' 조회 기준'}
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
  // { title: '1차수 손익', dataIndex: `profitLoss1`, className: 'numeric_value' },
  // { title: '2차수 손익', dataIndex: 'profitLoss2', className: 'numeric_value' },
  // { title: '3차수 손익', dataIndex: 'profitLoss3', className: 'numeric_value' },
  // { title: '전량 매도', dataIndex: 'sellAll', width: '8rem', render: () => <a>전량 매도</a> },
];
