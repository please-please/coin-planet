import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Typography } from 'antd';
import { I_coinListItem, COIN_LIST, columns } from '../constants/coinList';
import { useRouter } from 'next/router';
import { I_orderBody } from '../api/interface';
import { useRecoilValue } from 'recoil';
import { HasAsk } from '../recoil/atom';
import {
  useGetCoinPrice,
  useGetPurchaseData,
  useGetReservationOrderData,
  useOrderCoin,
  useSaveOrderData,
} from '../hooks';
import { getToken } from '../utils';
import { I_hasAsk } from '../recoil/interface';

interface I_orderData extends Partial<I_orderBody> {
  limit: number;
  askingRate: number;
  biddingRate: number;
  inputPrice: number;
}

function Order() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState({ order: false, reload: false });
  const [coinListData, setCoinListData] = useState<I_coinListItem[]>(COIN_LIST);
  const [orderData, _setOrderData] = useState<I_orderData>({
    limit: 0,
    market: '',
    side: 'bid',
    ord_type: 'limit',
    askingRate: 0,
    biddingRate: 0,
    inputPrice: 0,
  });
  const [isValidOrderInput, setIsValidOrderInput] = useState<boolean>(false);

  const hasAsk = useRecoilValue<I_hasAsk>(HasAsk);

  const [modal, contextHolder] = Modal.useModal();
  const router = useRouter();
  const coinPrice = useGetCoinPrice();
  const coinOrder = useOrderCoin();

  const setOrderData = (key: keyof I_orderData, value: I_orderData[typeof key]) => {
    _setOrderData((pre) => ({ ...pre, [key]: value }));
  };

  const countDown = () => {
    let secondsToGo = 5;

    const instance = modal.error({
      title: '저장된 api 키가 없습니다.',
      content: `${secondsToGo}초 후에 키 등록 페이지로 이동합니다.`,
    });

    instance.then(
      () => router.push('/apply'),
      () => router.push('/apply'),
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

  const reload = () => {
    setLoading((pre) => ({ ...pre, reload: true }));

    setTimeout(() => {
      setLoading((pre) => ({ ...pre, reload: false }));
    }, 800);

    coinPrice.reload();
  };

  const order = async () => {
    console.log('called order');
    // if (hasAsk[orderData.market]) return alert('미판매된 자동 매도 차수가 있습니다.\n전 차수 매도 후 주문해 주세요.');
    // if (orderData.limit <= 1) return alert('2차수 이상만 주문 가능합니다.');

    // setLoading((pre) => ({ ...pre, order: true }));
    // setTimeout(() => {
    //   setLoading((pre) => ({ ...pre, order: false }));
    // }, 700);

    // const coinPriceData = {};

    // for (let i = 0; i < coinPrice.tickerData.length; i++) {
    //   coinPriceData[coinPrice.tickerData[i].market] = coinPrice.tickerData[i].trade_price;
    // }

    // const body: I_orderBody = {
    //   market: orderData.market,
    //   side: orderData.side,
    //   volume: (orderData.inputPrice / coinPriceData[orderData.market]).toFixed(8),
    //   price:
    //     Number((coinPriceData[orderData.market] + '')[0]) +
    //     1 +
    //     '0'.repeat((coinPriceData[orderData.market] + '').split('.')[0].length - 1),
    //   ord_type: orderData.ord_type,
    // };

    // coinOrder.orderCoin(body);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
    setOrderData('market', coinListData[Number(newSelectedRowKeys[0]) - 1]?.market ?? '');
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  // 기존에 종목별 매매 예약 내역이 있는지 조회
  useGetReservationOrderData();

  // 주문 실행시 데이터 조회
  useGetPurchaseData();

  // 주문 실행시 주문 데이터 JSON 저장
  useSaveOrderData({
    [orderData.market]: {
      bid: [
        {
          inputPrice: orderData.inputPrice,
          ord_type: orderData.ord_type,
          biddingRate: orderData.biddingRate,
          askingRate: orderData.askingRate,
        },
      ],
      ask: [],
      limit: orderData.limit,
    },
  });

  // 등록된 API key가 없는 경우 등록 페이지로 리다이렉트
  useEffect(() => {
    getToken(countDown);
  }, []);

  // 실시간 코인 종목별 가격 조회
  useEffect(() => {
    if (coinPrice.tickerData?.length) {
      const coinPriceList = coinPrice.tickerData.map((coinPriceData) => coinPriceData.trade_price);

      setCoinListData(
        COIN_LIST.map((e, i) => {
          return { ...e, price: coinPriceList[i].toLocaleString() };
        }),
      );
    }
  }, [coinPrice.tickerData]);

  useEffect(() => {
    if (!Object.values(orderData).filter((v) => !v).length) {
      setIsValidOrderInput(true);
    }
  }, [orderData]);

  return (
    <React.Fragment>
      <Typography.Title level={2}>주문하기</Typography.Title>
      <div className="order_area">
        <div className="order_options">
          <Input placeholder="구매금액" onChange={(e) => setOrderData('inputPrice', Number(e.target.value))} />
          <Input placeholder="차수입력" onChange={(e) => setOrderData('limit', Number(e.target.value))} />
          <Input
            placeholder="자동매수 하락율(%)"
            onChange={(e) => setOrderData('biddingRate', Number(e.target.value))}
          />
          <Input
            placeholder="자동매도 증가율(%)"
            onChange={(e) => setOrderData('askingRate', Number(e.target.value))}
          />
        </div>
        <Button type="primary" onClick={order} disabled={!isValidOrderInput} loading={loading.order}>
          주문하기
        </Button>
      </div>
      <div className="order_buttons">
        <Button style={{ float: 'right', height: '50px' }} type="default" onClick={reload} loading={loading.reload}>
          새로고침
        </Button>
      </div>
      <Table
        style={{ marginTop: '1rem' }}
        rowSelection={rowSelection}
        columns={columns}
        dataSource={coinListData}
        pagination={false}
      />
      {contextHolder}
    </React.Fragment>
  );
}

export default Order;
