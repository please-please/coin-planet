import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';
import { Button, Modal, Input, Typography } from 'antd';
import { GET_SAVED_USER_DATA_FILE, SUCCESS, USER_DATA_RETURN } from '../../constants';
import { saveUserKey } from '../utils';

const isProd: boolean = process.env.NODE_ENV === 'production';

function Apply() {
  const [accessKey, setAccessKey] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [saveDisabled, setSaveDisabled] = useState<boolean>(false);

  useEffect(() => {
    ipcRenderer.send(GET_SAVED_USER_DATA_FILE, {});
    ipcRenderer.on(USER_DATA_RETURN, (_, arg) => {
      if (arg.status === SUCCESS) {
        setAccessKey(arg?.userData?.accessKey);
        setSecretKey(arg?.userData?.secretKey);
        setSaveDisabled(true);
      }
    });
  }, []);

  const handleAccessKeyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessKey(e.target.value);
    setSaveDisabled(false);
  };

  const handleSecretKeyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecretKey(e.target.value);
    setSaveDisabled(false);
  };

  const handleSecretKeyInputFocus = (_: React.ChangeEvent<HTMLInputElement>) => {
    setSecretKey('');
    setSaveDisabled(false);
  };

  const saveUserData = () => {
    if (accessKey === '' || secretKey === '') {
      setModalVisible(true);
      setModalMessage('값을 입력해주세요');
      return;
    }

    saveUserKey(
      { accessKey, secretKey },
      () => setModalVisible(true),
      () => setModalMessage('저장 성공'),
      () => setModalMessage('저장 실패'),
    );
  };

  return (
    <React.Fragment>
      <Typography.Title level={2}>api 키 등록</Typography.Title>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Input
          style={{ width: '60%' }}
          placeholder="Access Key"
          value={accessKey}
          onChange={handleAccessKeyInputChange}
        />
        <Input.Password
          visibilityToggle={false}
          style={{ marginTop: '1rem', width: '60%' }}
          placeholder="Secret Key"
          value={secretKey}
          onChange={handleSecretKeyInputChange}
          onFocus={handleSecretKeyInputFocus}
        />
        <Button
          style={{ marginTop: '3rem', width: '60%' }}
          disabled={saveDisabled}
          className="mt-4"
          onClick={saveUserData}
        >
          저장
        </Button>
      </div>
      <div>
        <Modal
          title={modalMessage}
          open={modalVisible}
          onOk={() => {
            setModalVisible(false);
          }}
        ></Modal>
      </div>
    </React.Fragment>
  );
}

export default Apply;
