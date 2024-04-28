import React, { useEffect, useState } from 'react';
import { TableColumnsType, Table, Typography } from 'antd';
import { useRecoilState } from 'recoil';
import { MyAssets, MyReservations, MyUserData } from '../../recoil/atom';
import electron from 'electron';
import { getCoinPrice } from '../../api/api';
import { I_tickerData } from '../../api/interface';
import { coinList } from '../../constants/coinList';

const ipcRenderer = electron.ipcRenderer;

const isProd: boolean = process.env.NODE_ENV === 'production';

interface I_tableData {
  key: React.Key;
  market: string;
  name: string;
  label?: string;
  profitLossComparedPreviousDay?: number;
  profitLoss1st?: number;
  profitLoss2nd?: number;
  profitLoss3rd?: number;
  totalProfitLoss?: number;
}

function Main() {
  const [tickerData, setTickerData] = useState<I_tickerData[]>();
  const [tableData, setTableData] = useState<I_tableData[]>(TABLE_DEFAULT_DATA);
  const [columns, setColumns] = useState<TableColumnsType<I_tableData>>(TABLE_DEFAULT_COLUMNS);
  const [myUserData, setMyUserData] = useRecoilState(MyUserData);
  const [myAssets, setMyAssets] = useRecoilState(MyAssets);
  const [myReservationOrderData, setMyReservationOrderData] = useRecoilState(MyReservations);

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
  };

  // const handleSelectPage = () => {
  //   if (isProd) {
  //     window.location.href = 'app://./select.html';
  //   } else {
  //     window.location.href = '../select';
  //   }
  // };

  // const handleApplyPage = () => {
  //   if (isProd) {
  //     window.location.href = 'app://./apply.html';
  //   } else {
  //     window.location.href = '../apply';
  //   }
  // };

  useEffect(() => {
    ipcRenderer.send('getSavedAssetsDataFile');
    ipcRenderer.on('assetsReturn', (_, arg) => {
      if (arg.status === 'success') {
        console.log(arg.assetsData);
        return () => ipcRenderer.removeAllListeners('assetsReturn');
      }
    });
  }, []);

  useEffect(() => {
    getCoinPrice()
      .then((res) => {
        setTickerData(res.data);
      })
      .catch(() => alert('조회 오류!'));
  }, []);

  useEffect(() => {
    if (tickerData) {
      const newTableData = tableData.map((item, i) => {
        const { prev_closing_price, change, change_price } = tickerData[i];
        const yinyang = change === 'FALL' ? -1 : 1;

        return {
          ...item,
          label: `${item.name}(${item.market})`,
          profitLossComparedPreviousDay: +((change_price / prev_closing_price) * yinyang * 100).toFixed(2),
        };
      });

      setTableData(newTableData);
    }
  }, [tickerData]);

  return (
    <React.Fragment>
      <Typography.Title level={2}>종목손익</Typography.Title>
      <Table columns={columns} dataSource={tableData} scroll={{ x: 1300 }} pagination={false} bordered />
    </React.Fragment>
  );
}

export default Main;

const TABLE_DEFAULT_DATA: I_tableData[] = coinList.map((v) => ({ key: v.key, market: v.market, name: v.name }));

const TABLE_DEFAULT_COLUMNS: TableColumnsType<I_tableData> = [
  {
    title: '종목이름',
    dataIndex: 'label',
    fixed: 'left',
  },
  {
    title: '전일대비 손익',
    dataIndex: 'profitLossComparedPreviousDay',
    className: 'numeric_value',
    render: (number) => (number ? <p style={{ color: `${number > 0 ? 'red' : 'blue'}` }}>{`${number}%`}</p> : null),
  },
  { title: '전체 손익', dataIndex: 'totalProfitLoss', className: 'numeric_value' },
  { title: '1차수 손익', dataIndex: 'profitLoss1st', className: 'numeric_value' },
  { title: '2차수 손익', dataIndex: 'profitLoss2nd', className: 'numeric_value' },
  { title: '3차수 손익', dataIndex: 'profitLoss3rd', className: 'numeric_value' },
  { title: '전량 매도', dataIndex: 'sellAll', fixed: 'right', render: () => <a>전량 매도</a> },
];
