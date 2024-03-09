import React, { useEffect } from 'react';
import { Button, TableColumnsType, Table } from 'antd';
import { useRecoilState } from 'recoil';
import { MyAssets, MyReservations, MyUserData } from '../../repository/atom';
import electron from 'electron';

const ipcRenderer = electron.ipcRenderer;

const isProd: boolean = process.env.NODE_ENV === 'production';

interface DataType {
  key: React.Key;
  name: string;
  age: number;
  address: string;
}

const columns: TableColumnsType<DataType> = [
  {
    title: '종목이름',
    width: 100,
    dataIndex: 'name',
    fixed: 'left',
  },
  {
    title: 'Age',
    width: 100,
    dataIndex: 'age',
  },
  { title: 'Column 1', dataIndex: 'address', fixed: 'left' },
  { title: 'Column 2', dataIndex: 'address' },
  { title: 'Column 3', dataIndex: 'address' },
  { title: 'Column 4', dataIndex: 'address' },
  { title: 'Column 5', dataIndex: 'address' },
  { title: 'Column 6', dataIndex: 'address' },
  { title: 'Column 7', dataIndex: 'address' },
  { title: 'Column 8', dataIndex: 'address' },
  {
    title: 'Action 1',
    fixed: 'right',
    width: 90,
    render: () => <a>action</a>,
  },
  {
    title: 'Action 2',
    width: 90,
    render: () => <a>action</a>,
  },
  {
    title: 'Action 3',
    fixed: 'right',
    width: 90,
    render: () => <a>action</a>,
  },
];

const data: DataType[] = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    address: 'New York Park',
  },
];

function Home() {
  const [myUserData, setMyUserData] = useRecoilState(MyUserData);
  const [myAssets, setMyAssets] = useRecoilState(MyAssets);
  const [myReservationOrderData, setMyReservationOrderData] = useRecoilState(MyReservations);

  useEffect(() => {
    // 저장되어있는 private user data 불러와서 글로벌에 할당해야함. recoil 쓸까 말까

    ipcRenderer.send('getSavedUserDataFile', {});
    ipcRenderer.on('reply', (evt, arg) => {
      if (arg.status === 'success') {
        setMyUserData(arg.userData);
        console.log(arg.userData);
      }
    });

    ipcRenderer.send('getSavedAssetsDataFile', {});
    ipcRenderer.on('assetsReturn', (evt, arg) => {
      if (arg.status === 'success') {
        setMyAssets(arg.assetsData);
      }
      console.log(arg.assetsData);
    });

    ipcRenderer.send('getSavedReservationOrderDataFile', {});
    ipcRenderer.on('reservationOrderReturn', (evt, arg) => {
      if (arg.status === 'success') {
        setMyReservationOrderData(arg.reservationOrderData);
      }
      console.log(arg.reservationOrderData);
    });
  }, []);

  const reload = () => {
    // 체결내역 불러와서
    // 추가된 체결내역 있는지 확인하고
    // 있으면 추가된 체결내역을 assetsData에 추가하고
    // myAssets에 추가할당하고
    // 현재가 불러와서
    // myAssets에 있는 것들 수익률 계산하고
    // 화면 렌더링
  };

  const handleSelectPage = () => {
    if (isProd) {
      window.location.href = 'app://./select.html';
    } else {
      window.location.href = '../select';
    }
  };

  const handleApplyPage = () => {
    if (isProd) {
      window.location.href = 'app://./apply.html';
    } else {
      window.location.href = '../apply';
    }
  };

  return (
    <React.Fragment>
      {/* <Header>
        <a className="text-white">리스트</a>
      </Header> */}

      <Table columns={columns} dataSource={data} scroll={{ x: 1300 }} pagination={false} bordered />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          alignItems: 'center',
          marginTop: '50px',
        }}
      >
        <Button size={'large'} onClick={handleApplyPage}>
          key 등록
        </Button>
        <Button size={'large'} onClick={handleSelectPage}>
          주문
        </Button>
      </div>
    </React.Fragment>
  );
}

export default Home;
