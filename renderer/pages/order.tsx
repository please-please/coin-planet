import React, { useEffect, useState } from 'react';
import { Button, Input, Layout, Modal, Table } from 'antd';
import { coinList, columns } from '../constants/coinList';
import { getCoinPrice, orderReservationCoin, orderCoin } from '../api/api';
import electron from 'electron';
import { useRouter } from 'next/router';
import { I_orderBody } from '../api/interface';

const ipcRenderer = electron.ipcRenderer;

const { Header } = Layout;

interface I_orderData {
  limit: number;
  market: string;
  plus: number;
  minus: number;
  price: number;
}

function Order() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({ order: false, reload: false });
  const [coinListData, setCoinListData] = useState(coinList);
  const [orderData, setOrderData] = useState<I_orderData>({
    limit: 1,
    market: '',
    minus: 5,
    plus: 5,
    price: 5000,
  });
  // const [afterFirstBuyData, setAfterFirstBuyData] = useState([]);
  // const [reservationOrderData, setReservationOrderData] = useState({ bid: [], ask: [] });
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
    ipcRenderer.send('getToken', {});
    ipcRenderer.on('tokenReturn', (_, arg) => {
      if (arg.status === 'fail') countDown();
      return () => ipcRenderer.removeAllListeners('tokenReturn');
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
    let token: string;
    const { data } = await getCoinPrice();
    const coinPriceData = {
      'KRW-BTC': data[0].trade_price,
      'KRW-ETH': data[1].trade_price,
      'KRW-XRP': data[2].trade_price,
    };
    console.log(coinPriceData);
    const body: any = {
      market: orderData.market,
      side: 'bid',
      price: (coinPriceData[orderData.market] + coinPriceData[orderData.market] * (1 / 100)).toFixed(1),
      ord_type: 'limit',
      volume: (orderData.price / coinPriceData[orderData.market]).toFixed(2),
      // ord_type: 'price',
    };
    // [
    //   {
    //     bid: [
    //       {
    //         number: 2,
    //         market: 'KRW-BTC',
    //         side: 'bid',
    //         price: '1차수에 구매한 가격 * 0.95 * 0.95', // 일단 -5퍼에서 매수되게 고정해놓고 나중에 변수로 뺴서 수정
    //         ord_type: 'limit',
    //         volume: orderData.price / this.price,
    //       },
    //     ],
    //     ask: [
    //       {
    //         number: 1,
    //         market: 'KRW-BTC',
    //         side: 'bid',
    //         price: '1차수에 구매한 가격 * 1.05', // 일단 +5퍼에서 매도되게 고정해놓고 나중에 변수로 뺴서 수정
    //         ord_type: 'limit',
    //         volume: orderData.price / this.price,
    //       },
    //       {
    //         number: 2,
    //         market: 'KRW-BTC',
    //         side: 'bid',
    //         price: '1차수에 구매한 가격 * 0.95 *1.05', // 일단 +5퍼에서 매도되게 고정해놓고 나중에 변수로 뺴서 수정
    //         ord_type: 'limit',
    //         volume: orderData.price / this.price,
    //       },
    //     ],
    //   },
    // ];

    ipcRenderer.send('getToken', { body });
    ipcRenderer.on('tokenReturn', async (_, arg) => {
      if (arg.status === 'success') {
        token = arg.token;
        console.log(body);
        await orderCoin(token, body)
          .then(() => {
            const firstOrderData = {
              bid: [
                {
                  limit: 1,
                  market: orderData.market,
                  price: orderData.price,
                  // purchasePrice:
                },
              ],
              ask: [],
            };

            ipcRenderer.send('orderFirst', firstOrderData);
          })
          .catch((e) => alert(e.response.data.error.message));
      }

      if (arg.status === 'fail') alert('토큰 생성 실패');
    });

    // ipcRenderer.removeAllListeners('tokenReturn');
    // const bodyData = {
    //   uuid: data.uuid,
    // };
    // ipcRenderer.send('getToken', { body: bodyData });
    // ipcRenderer.on('tokenReturn', async (_, arg) => {
    //   console.log(arg);
    //   if (arg.status === 'success') {
    //     const response = await getPurchaseData(bodyData, arg.token, arg.query);
    //     console.log(data);
    //   }
    // });
  };

  // setTimeout(() => {
  //   setLoading((pre) => ({ ...pre, order: false }));
  // }, 1000);

  //
  // for (let i = 2; i < orderData.limit + 1; i++) {
  //   ipcRenderer.send('limitOrder', {
  //     limit: i, // 차수
  //     side: 'bid', // 매수
  //     market: orderData.market, // 종목
  //     price: data.price * (1 - 5 / 100), // 가격
  //     totalMoney: orderData.totalMoney, // 금액
  //   });
  //   setReservationOrderData({
  //     bid: [
  //       ...reservationOrderData.bid,
  //       {
  //         limit: i,
  //         market: orderData.market,
  //         price: data.price * (1 - 5 / 100),
  //         totalMoney: orderData.totalMoney,
  //         side: 'bid',
  //       },
  //     ],
  //     ask: reservationOrderData.ask,
  //   }); // 2차 매수

  // await orderReservationCoin(orderData, i, 'ask', data.price); // 2차 매도
  // setReservationOrderData({
  //   bid: reservationOrderData.bid,
  //   ask: [
  //     ...reservationOrderData.ask,
  //     {
  //       limit: i,
  //       market: orderData.market,
  //       price: data.price * (1 + 5 / 100),
  //       totalMoney: orderData.totalMoney,
  //       side: 'ask',
  //     },
  //   ],
  // }); // 2차 매도
  // };

  // ipcRenderer.send('orderReservation', reservationOrderData);
  // setSelectedRowKeys([]); // 선택 초기화
  // ipcRenderer.send('order', orderData);

  // };

  const onLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderData({ ...orderData, limit: Number(e.target.value) });
  };

  const onPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderData({ ...orderData, price: Number(e.target.value) });
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
    setOrderData({ ...orderData, market: coinListData[Number(newSelectedRowKeys[0]) - 1]?.market ?? '' });
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

export default Order;
