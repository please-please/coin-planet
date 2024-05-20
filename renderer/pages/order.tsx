import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Typography } from 'antd';
import { coinList, columns } from '../constants/coinList';
import { getPurchaseData, orderCoin } from '../api/api';
import { useRouter } from 'next/router';
import { I_coinOrderData, I_orderBody } from '../api/interface';
import { useRecoilValue } from 'recoil';
import { HasAsk } from '../recoil/atom';
import { useGetCoinPrice, useGetReservationOrderData } from '../hooks';
import { getToken, orderFirst, orderReservation } from '../utils';
import { ipcRenderer } from 'electron';
import { API_REQ_GET_COIN_CURRENT_PRICE, API_RES_COIN_CURRENT_PRICE_RETURN } from '../../constants';

interface I_orderData extends Partial<I_orderBody> {
  limit: number;
  plus: number;
  minus: number;
  inputPrice: number;
}

function Order() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({ order: false, reload: false });
  const [coinListData, setCoinListData] = useState(coinList);
  const [orderData, setOrderData] = useState<I_orderData>({
    limit: 1,
    market: '',
    side: 'bid',
    ord_type: 'limit',
    minus: 5,
    plus: 5,
    inputPrice: 0,
  });

  const hasAsk = useRecoilValue(HasAsk);

  const [modal, contextHolder] = Modal.useModal();
  const router = useRouter();
  const coinPrice = useGetCoinPrice();

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

  useGetReservationOrderData();

  useEffect(() => {
    getToken(countDown);
  }, []);

  useEffect(() => {
    if (coinPrice.tickerData?.length) {
      const coinPriceList = coinPrice.tickerData.map((coinPriceData) => coinPriceData.trade_price);

      setCoinListData(
        coinList.map((e, i) => {
          return { ...e, price: coinPriceList[i].toLocaleString() };
        }),
      );
    }
  }, [coinPrice.tickerData]);

  const reload = () => {
    setLoading((pre) => ({ ...pre, reload: true }));

    setTimeout(() => {
      setLoading((pre) => ({ ...pre, reload: false }));
    }, 800);

    coinPrice.reload();
  };

  const order = async () => {
    if (hasAsk[orderData.market]) return alert('미판매된 자동 매도 차수가 있습니다.\n전 차수 매도 후 주문해 주세요.');

    setLoading((pre) => ({ ...pre, order: true }));
    setTimeout(() => {
      setLoading((pre) => ({ ...pre, order: false }));
    }, 700);

    const coinPriceData = {};

    for (let i = 0; i < coinPrice.tickerData.length; i++) {
      coinPriceData[coinPrice.tickerData[i].market] = coinPrice.tickerData[i].trade_price;
    }

    const body: I_orderBody = {
      market: orderData.market,
      side: orderData.side,
      price: Math.ceil(coinPriceData[orderData.market] / 100) * 100,
      ord_type: orderData.ord_type,
      volume: (orderData.inputPrice / coinPriceData[orderData.market]).toFixed(8),
    };

    const successCallback = (arg: any) => {
      if (arg.query) {
        const { token } = arg;
        orderCoin(token, body)
          .then((res) => {
            const { data } = res;
            const uuid = data.uuid;

            setTimeout(() => {
              getToken(
                () => alert('구매데이터 조회 토큰 발행실패'),
                (arg) => {
                  getPurchaseData({ uuid }, arg.token)
                    .then((res) => {
                      const writeOrder = (res) => {
                        const { price } = res.data?.trades?.[0];
                        const firstOrderData: I_coinOrderData = {
                          [data.market]: {
                            bid: [
                              {
                                number: 1,
                                price: price,
                                volume: data.volume,
                                ord_type: data.ord_type,
                                created_at: data.created_at,
                                inputPrice: orderData.inputPrice,
                              },
                            ],
                            ask: [],
                          },
                        };

                        orderFirst(firstOrderData);

                        // 다차수 주문
                        if (orderData.limit > 1) {
                          const nextOrderData: I_coinOrderData = {
                            [data['market']]: {
                              bid: [
                                {
                                  number: 2,
                                  price: price * (100 - orderData.minus) * 0.01,
                                  ord_type: data.ord_type,
                                  inputPrice: orderData.inputPrice,
                                },
                              ],
                              ask: [
                                {
                                  number: 1,
                                  price: price * (100 + orderData.plus) * 0.01,
                                  ord_type: data.ord_type,
                                  created_at: '',
                                  volume: data.volume,
                                  inputPrice: orderData.inputPrice,
                                },
                              ],
                              limit: orderData.limit,
                            },
                          };

                          orderReservation(nextOrderData);
                        }
                      };
                      if (res.data.state === 'wait') {
                        let id = setInterval(() => {
                          getPurchaseData({ uuid }, arg.token).then((res) => {
                            if (res.data.state === 'done') {
                              clearInterval(id);
                              writeOrder(res);
                            }
                          });
                        }, 500);
                      }
                      if (res.data.state === 'done') writeOrder(res);
                    })
                    .catch((error) => {
                      console.log(error);
                      alert(error);
                    });
                },
                { uuid },
              );
            }, 500);
          })
          .catch((e) => alert(e.response.data.error.message));
      }
    };

    getToken(() => alert('토큰 생성 실패'), successCallback, body);
  };

  const onLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderData({ ...orderData, limit: Number(e.target.value) });
  };

  const onPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderData({ ...orderData, inputPrice: Number(e.target.value) });
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
      <Typography.Title level={2}>주문하기</Typography.Title>
      <div>
        <Button style={{ float: 'right', height: '50px' }} type="primary" onClick={reload} loading={loading.reload}>
          새로고침
        </Button>
        <Button
          style={{ float: 'right', height: '50px', marginRight: '10px' }}
          type="primary"
          onClick={order}
          disabled={!hasSelected}
          loading={loading.order}
        >
          주문하기
        </Button>
        <Input style={{ marginTop: '1rem' }} placeholder="구매금액" onChange={onPriceChange}></Input>
        <Input style={{ marginTop: '0.5rem' }} placeholder="차수입력" onChange={onLimitChange}></Input>
      </div>
      <Table
        style={{ marginTop: '2rem' }}
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
