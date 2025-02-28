import React, { useEffect, useState } from 'react';
import { Button, Form, Input, message, Modal, Popover, Switch, Table, Typography } from 'antd';
import { COIN_LIST } from '../../constants/coinList';
import { useRouter } from 'next/router';
import { I_orderBody } from '../../api/interface';
import { useGetCoinPrice, useGetCoinSetting } from '../../hooks';
import { getUserKeys, numberToKoreanWithFormat, order1stAndSaveSetting, saveCoinSetting } from '../../utils';
import { I_coinDataItem, I_orderInputError, I_saveCoinSettingArg } from '../../constants/interface';
import style from './index.module.scss';
import { SwitchChangeEventHandler } from 'antd/es/switch';
import { MIN_INPUT_PRICE } from '../../constants';

interface I_orderData extends Partial<I_orderBody> {
  market: string;
  limit?: number;
  askingRate?: number;
  biddingRate?: number;
  inputPrice?: number;
  watching: boolean;
  boosting: boolean;
}

const DEFAULT_ORDER_DATA: I_orderData = {
  market: '',
  watching: false,
  boosting: false,
};

const DEFAULT_ERROR: I_orderInputError = {
  inputPrice: false,
  askingRate: false,
  biddingRate: false,
  limit: false,
};

function Order() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<I_orderInputError>(DEFAULT_ERROR);
  const [tableSource, setTableSource] = useState<I_coinDataItem[]>([]);
  const [orderData, _setOrderData] = useState<I_saveCoinSettingArg>(DEFAULT_ORDER_DATA);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<I_coinDataItem>();
  const [settingChanged, setSettingChanged] = useState(false);

  const [modal, modalContextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();

  const router = useRouter();
  const coinPrice = useGetCoinPrice();
  const { coinSettingData, refetch: refetchCoinSetting } = useGetCoinSetting();

  const columns = [
    {
      title: '코인명',
      render: (coin: I_coinDataItem) => `${coin.name}(${coin.market})`,
    },
    {
      title: '현재가',
      dataIndex: 'currentPrice',
      render: (currentPrice: I_coinDataItem['currentPrice']) => `${currentPrice.toLocaleString()}원`,
    },
    {
      title: '1차매수 여부',
      dataIndex: 'firstOrder',
      render: (firstOrder: I_coinDataItem['firstOrder']) => (firstOrder ? '✅' : '❌'),
    },
    {
      title: '자동매매 여부',
      dataIndex: 'watching',
      render: (watching: I_coinDataItem['watching']) => (watching ? '✅' : '❌'),
    },
    {
      title: '부스팅 여부',
      dataIndex: 'boosting',
      render: (boosting: I_coinDataItem['boosting']) => (boosting ? '✅' : '❌'),
    },
    {
      title: '상세보기',
      render: (coin: I_coinDataItem) => (
        <button
          className={style.detailButton}
          onClick={(e) => {
            e.stopPropagation();
            handleClickCoinDetail(coin);
          }}
        >
          상세보기
        </button>
      ),
    },
  ];

  const handleClickCoinDetail = (coin: I_coinDataItem) => {
    setDetailModalOpen(true);
    setSelectedCoin(coin);
    if (coinSettingData?.[coin.market]) {
      const setting = coinSettingData?.[coin.market];
      _setOrderData((pre) => ({
        ...pre,
        market: coin.market,
        limit: setting.limit,
        askingRate: setting.askingRate,
        biddingRate: setting.biddingRate,
        inputPrice: setting.inputPrice,
        watching: setting.watching,
        boosting: setting.boosting,
      }));
    }
    _setOrderData((pre) => ({ ...pre, market: coin.market }));
  };

  const setOrderData = (key: keyof I_orderData, value: I_orderData[typeof key]) => {
    setSettingChanged(true);
    _setOrderData((pre) => ({ ...pre, [key]: value }));
  };

  const setNumericOrderData = (key: keyof I_orderData, value: number | string) => {
    if (Number.isNaN(Number(value))) return;

    setSettingChanged(true);
    setOrderData(key, Number(value));
  };

  const handleChangeWatching: SwitchChangeEventHandler = (e) => {
    const newWatching = e.valueOf();
    newWatching
      ? setOrderData('watching', newWatching)
      : _setOrderData((pre) => ({ ...pre, watching: newWatching, boosting: false }));
  };

  const reload = () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 800);

    coinPrice.reload();
    refetchCoinSetting();
  };

  const closeModal = () => {
    _setOrderData(DEFAULT_ORDER_DATA);
    setError(DEFAULT_ERROR);
    setDetailModalOpen(false);
    setSettingChanged(false);
  };

  const handleCancelModal = () => {
    if (!settingChanged) closeModal();
    else
      Modal.confirm({
        title: 'Warning',
        content: '창을 닫을까요? 입력된 내용은 저장되지 않습니다.',
        onOk() {
          closeModal();
        },
      });
  };

  const handleOkModal = () => {
    if (
      !orderData.inputPrice ||
      orderData.inputPrice < MIN_INPUT_PRICE ||
      !orderData.askingRate ||
      !orderData.biddingRate ||
      !orderData.limit ||
      orderData.limit < 2
    ) {
      setError({
        inputPrice: !!!orderData.inputPrice || orderData.inputPrice < MIN_INPUT_PRICE,
        askingRate: !!!orderData.askingRate,
        biddingRate: !!!orderData.biddingRate,
        limit: !!!orderData.limit || orderData.limit < 2,
      });
      messageApi.open({
        type: 'error',
        content: `값을 입력해주세요. (매매금액은 ${MIN_INPUT_PRICE.toLocaleString()}원 이상)`,
      });
      return;
    }

    if (!selectedCoin.firstOrder && orderData.watching) {
      Modal.confirm({
        title: 'Confirm',
        content: (
          <>
            자동매매를 실행하기 위해서는 1차 매수가 되어야 합니다.
            <br />
            1차 매수를 진행하시겠습니까?
          </>
        ),
        onOk() {
          const arg = {
            settingData: { market: selectedCoin.market, ...orderData },
            orderData: { market: selectedCoin.market, inputPrice: orderData.inputPrice },
          };
          console.log(JSON.stringify(arg));
          order1stAndSaveSetting(arg, () => {
            refetchCoinSetting();
            closeModal();
          });
        },
      });
      return;
    }

    saveCoinSetting(orderData, () => {
      messageApi.open({ type: 'success', content: '세팅이 저장되었습니다.' });
      refetchCoinSetting();
      closeModal();
    });
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

  // 등록된 API key가 없는 경우 등록 페이지로 리다이렉트
  useEffect(() => {
    getUserKeys(countDown);
  }, []);

  // 실시간 코인 종목별 가격 조회
  useEffect(() => {
    if (coinPrice.tickerData?.length) {
      const coinPriceList = coinPrice.tickerData.map((coinPriceData) => coinPriceData.trade_price);

      const coinData = COIN_LIST.map((coin, i) => ({
        key: i,
        market: coin.market,
        name: coin.name,
        currentPrice: coinPriceList[i],
        watching: coinSettingData?.[coin.market]?.watching ? coinSettingData[coin.market].watching : false,
        firstOrder: coinSettingData?.[coin.market]?.firstOrder ? coinSettingData[coin.market].firstOrder : false,
        boosting: coinSettingData?.[coin.market]?.boosting ? coinSettingData[coin.market].boosting : false,
      }));

      setTableSource(coinData);
    }
  }, [coinPrice.tickerData, coinSettingData]);

  return (
    <React.Fragment>
      <Typography.Title level={2}>주문하기</Typography.Title>
      <div className={style.refreshButtonWrapper}>
        <Button loading={loading} onClick={reload}>
          새로고침
        </Button>
      </div>
      <Table style={{ marginTop: '1rem' }} columns={columns} dataSource={tableSource} pagination={false} />
      <Modal title="코인별 세팅하기" centered open={detailModalOpen} onCancel={handleCancelModal} onOk={handleOkModal}>
        <Form labelCol={{ span: 6 }}>
          <Form.Item label="코인명">
            <span className="ant-form-text">{`${selectedCoin?.name}(${selectedCoin?.market})`}</span>
          </Form.Item>
          <Form.Item label="1차매수 여부">{selectedCoin?.firstOrder ? '✅' : '❌'}</Form.Item>
          <Form.Item label="차수별 매매 금액">
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}>
              <Input
                value={orderData.inputPrice ?? ''}
                status={error.inputPrice ? 'error' : ''}
                onChange={(e) => {
                  setNumericOrderData('inputPrice', e.currentTarget.value);
                  setError((pre) => ({ ...pre, inputPrice: false }));
                }}
                maxLength={8}
                placeholder={`${MIN_INPUT_PRICE.toLocaleString()}원 이상`}
                suffix="원"
              />
              {orderData.inputPrice > 0 && <div>{`${numberToKoreanWithFormat(orderData.inputPrice)}원`}</div>}
            </div>
          </Form.Item>
          <Form.Item label="변동 감지">
            <div style={{ display: 'flex', gap: '10px' }}>
              <Input
                value={orderData.biddingRate ?? ''}
                status={error.biddingRate ? 'error' : ''}
                onChange={(e) => {
                  setNumericOrderData('biddingRate', e.currentTarget.value);
                  setError((pre) => ({ ...pre, biddingRate: false }));
                }}
                placeholder="n% 오르면 판매"
                suffix="%"
              />
              <Input
                value={orderData.askingRate ?? ''}
                status={error.askingRate ? 'error' : ''}
                onChange={(e) => {
                  setNumericOrderData('askingRate', e.currentTarget.value);
                  setError((pre) => ({ ...pre, askingRate: false }));
                }}
                placeholder="n% 내리면 구매"
                suffix="%"
              />
            </div>
          </Form.Item>
          <Form.Item label="매수최대차수">
            <Input
              value={orderData.limit}
              status={error.limit ? 'error' : ''}
              onChange={(e) => {
                setNumericOrderData('limit', e.currentTarget.value);
                setError((pre) => ({ ...pre, limit: false }));
              }}
              placeholder="2 이상"
            />
          </Form.Item>
          <Form.Item label="자동매매">
            <Switch value={orderData.watching} onChange={handleChangeWatching} />
          </Form.Item>
          <Form.Item
            label={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                부스팅
                <Popover
                  content={
                    <div style={{ fontSize: '12px' }}>
                      1차에서 매도가 되면 곧바로
                      <br />
                      해당 가격으로 1차 매수를 수행합니다.
                      <br />
                      <span style={{ color: 'gray' }}>(자동매매 상태에서만 체크 가능)</span>
                    </div>
                  }
                >
                  <svg
                    style={{ marginLeft: '5px', marginBottom: '4px', cursor: 'pointer' }}
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M5.99985 8.36848V8.5M4.94722 4.5C4.94722 3.82771 5.49221 3.36848 6.1645 3.36848C7.32053 3.36848 7.82557 4.82872 6.91657 5.54294L6.53004 5.84663C6.1953 6.10965 5.99985 6.51178 5.99985 6.93749V7.05269M11 6C11 8.76142 8.76142 11 6 11C3.23858 11 1 8.76142 1 6C1 3.23858 3.23858 1 6 1C8.76142 1 11 3.23858 11 6Z"
                      stroke="#999999"
                      strokeWidth="0.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Popover>
              </div>
            }
          >
            <Switch
              disabled={!orderData.watching}
              value={orderData.boosting}
              onChange={(e) => {
                setOrderData('boosting', e.valueOf());
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
      {modalContextHolder}
      {messageContextHolder}
    </React.Fragment>
  );
}

export default Order;
