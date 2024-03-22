import React, { useEffect, useState } from 'react';
import { Button, Input, Layout, Modal, Table } from 'antd';
import { coinList, columns } from '../constants/coinList';
import { getCoinPrice, orderReservationCoin, orderCoin } from '../api/api';
import electron from 'electron';
import { useRouter } from 'next/router';

const ipcRenderer = electron.ipcRenderer;

const { Header } = Layout;

function Select() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({ order: false, reload: false });
  const [coinListData, setCoinListData] = useState(coinList);
  const [orderData, setOrderData] = useState({
    limit: 1,
    symbol: '',
    minus: 5,
    plus: 5,
    totalMoney: 5000,
  });
  // const [afterFirstBuyData, setAfterFirstBuyData] = useState([]);
  const [reservationOrderData, setReservationOrderData] = useState({ bid: [], ask: [] });
  const router = useRouter();
  const [modal, contextHolder] = Modal.useModal();

  const countDown = () => {
    let secondsToGo = 5;

    const instance = modal.error({
      title: '저장된 api 키가 없습니다.',
      content: `${secondsToGo}초 후에 키 등록 페이지로 이동합니다.`,
    });

    instance.then(
      () => {
        router.push('/apply');
      },
      () => {
        router.push('/apply');
      },
    );

    const timer = setInterval(() => {
      secondsToGo -= 1;
      instance.update({
        content: `${secondsToGo}초 후에 키 등록 페이지로 이동합니다.`,
      });
    }, 1000);

    setTimeout(() => {
      clearInterval(timer);
      instance.destroy();
      if (router.asPath !== '/apply') router.push('/apply');
    }, secondsToGo * 1000);
  };

  useEffect(() => {
    ipcRenderer.send('getSavedUserDataFile', {});
    ipcRenderer.on('userDataReturn', (evt, arg) => {
      if (arg.status === 'fail') {
        countDown();
      }
    });
  }, []);

  useEffect(() => {
    getCoinPrice().then((res) => {
      const coinPriceList = res.data.map((coinPricdData) => coinPricdData.trade_price);

      setCoinListData(
        coinList.map((e, i) => {
          return { ...e, price: coinPriceList[i] };
        }),
      );
    });
  }, []);

  const reload = () => {
    setLoading((pre) => ({ ...pre, reload: true }));

    setTimeout(() => {
      setSelectedRowKeys([]);
      setLoading((pre) => ({ ...pre, reload: false }));
    }, 800);

    getCoinPrice()
      .then((res) => {
        const coinPriceList = res.data.map((coinPriceData) => coinPriceData.trade_price);

        setCoinListData(
          coinList.map((e, i) => {
            return { ...e, price: coinPriceList[i] };
          }),
        );
      })
      .catch(() => alert('reloading failed'));
  };

  const order = async () => {
    setLoading((pre) => ({ ...pre, order: true }));

    // 일단 1차수 구매
    const { data } = await orderCoin({ ...orderData, side: 'bid' });

    // 구매 데이터 저장

    const firstOrderData = {
      bid: [
        {
          limit: 1,
          symbol: orderData.symbol,
          price: data.price,
          totalMoney: orderData.totalMoney,
        },
      ],
      ask: [],
    };

    ipcRenderer.send('orderFirst', firstOrderData);

    //
    for (let i = 2; i < orderData.limit + 1; i++) {
      ipcRenderer.send('limitOrder', {
        limit: i, // 차수
        side: 'bid', // 매수
        symbol: orderData.symbol, // 종목
        price: data.price * (1 - 5 / 100), // 가격
        totalMoney: orderData.totalMoney, // 금액
      });
      setReservationOrderData({
        bid: [
          ...reservationOrderData.bid,
          {
            limit: i,
            symbol: orderData.symbol,
            price: data.price * (1 - 5 / 100),
            totalMoney: orderData.totalMoney,
            side: 'bid',
          },
        ],
        ask: reservationOrderData.ask,
      }); // 2차 매수

      // await orderReservationCoin(orderData, i, 'ask', data.price); // 2차 매도
      setReservationOrderData({
        bid: reservationOrderData.bid,
        ask: [
          ...reservationOrderData.ask,
          {
            limit: i,
            symbol: orderData.symbol,
            price: data.price * (1 + 5 / 100),
            totalMoney: orderData.totalMoney,
            side: 'ask',
          },
        ],
      }); // 2차 매도
    }

    ipcRenderer.send('orderReservation', reservationOrderData);
    setSelectedRowKeys([]); // 선택 초기화
    ipcRenderer.send('order', orderData);

    setTimeout(() => {
      setLoading((pre) => ({ ...pre, order: false }));
    }, 1000);
  };

  const onLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderData({ ...orderData, limit: Number(e.target.value) });
  };

  const onPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderData({ ...orderData, totalMoney: Number(e.target.value) });
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
    setOrderData({ ...orderData, symbol: coinListData[Number(newSelectedRowKeys[0]) - 1]?.symbol ?? '' });
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  const hasSelected = selectedRowKeys.length > 0;
  return (
    <React.Fragment>
      <Header>
        <a className="text-white">2. 선택</a>
      </Header>

      <div>
        <Button style={{ float: 'right', height: '60px' }} type="primary" onClick={reload} loading={loading.reload}>
          Reload
        </Button>
        <Button
          style={{ float: 'right', height: '60px', marginRight: '10px' }}
          type="primary"
          onClick={order}
          disabled={!hasSelected}
          loading={loading.order}
        >
          Order
        </Button>
        <Input placeholder="구매금액" onChange={onPriceChange}></Input>
        <Input placeholder="차수입력" onChange={onLimitChange}></Input>
      </div>
      <Table rowSelection={rowSelection} columns={columns} dataSource={coinListData} />
      {contextHolder}
    </React.Fragment>
  );
}

export default Select;
