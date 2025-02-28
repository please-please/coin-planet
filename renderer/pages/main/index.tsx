import React, { useState } from 'react';
import { Typography, Menu, Popover, Button } from 'antd';
import { useGetSortedPurchaseData } from '../../hooks';
import { COIN_LIST } from '../../constants/coinList';

function Main() {
  const { sortedPurchaseData, refetch } = useGetSortedPurchaseData();

  const [selectedKey, setSelectedKey] = useState<string>(COIN_LIST[0].market);

  // TODO: 코인리스트 교체
  // useGetCoinList();

  // const clickUploadHandler = () => {
  //   inputRef.current.click();
  // };

  // const changeInputHandler: React.ChangeEventHandler<HTMLInputElement> = (e) => {
  //   const file = inputRef.current.files[0];
  //   if (file) {
  //     const callback = () => {
  //       reload();
  //     };
  //     uploadJSON(file, callback);
  //   }
  // };

  const [isLoading, setIsLoading] = useState(false);

  const reload = async () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
    refetch();
  };

  const clickReloadHandler = () => {
    reload()
      .then(() => {})
      .catch(() => alert('새로고침 실패'));
  };

  return (
    <React.Fragment>
      <Typography.Title level={2}>매매 내역</Typography.Title>
      <div className="buttons">
        {/* <Button disabled={!assetData.isFetched} type="default" onClick={() => downloadJSON()} loading={isLoading}>
          데이터 다운로드
        </Button>
        <Button type="default" onClick={clickUploadHandler} loading={isLoading}>
          데이터 업로드
        </Button> */}
        <Button type="primary" onClick={clickReloadHandler} loading={isLoading}>
          새로고침
        </Button>
      </div>
      <div style={{ display: 'flex' }}>
        <Menu
          defaultSelectedKeys={[COIN_LIST[0].market]}
          onSelect={(item) => setSelectedKey(item.key)}
          style={{ width: 256 }}
          items={[...COIN_LIST.map((coin) => ({ key: coin.market, label: `${coin.name}(${coin.market})` }))]}
        />
        <div style={{ width: '100%', display: 'grid', gridTemplateRows: '30px' }}>
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', justifyItems: 'center' }}>
            <div>매수</div>
            <div>매도</div>
          </div>
          {sortedPurchaseData && sortedPurchaseData[selectedKey]?.length > 0 ? (
            sortedPurchaseData?.[selectedKey].map((ele) => (
              <div
                className={ele.orderType === 'ask' ? 'justify-self-end' : ''}
                style={{ width: '50%', padding: '0 10px' }}
              >
                <Popover placement="right" content={new Date(ele.created_at).toLocaleString()}>
                  <div
                    style={{
                      display: 'flex',
                      height: '30px',
                      width: '100%',
                      borderRadius: '8px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: `${ele.orderType === 'ask' ? '#d2b892' : '#729178'}`,
                      color: `${ele.orderType === 'ask' ? 'black' : 'white'}`,
                      marginBottom: '5px',
                    }}
                  >
                    {ele.volume}
                  </div>
                </Popover>
              </div>
            ))
          ) : (
            <div className="w-full h-full flex justify-center items-center text-3xl">텅</div>
          )}
        </div>
      </div>
      {/* <input onChange={changeInputHandler} ref={inputRef} className="file_input" type="file" accept=".zip" /> */}
    </React.Fragment>
  );
}

export default Main;
