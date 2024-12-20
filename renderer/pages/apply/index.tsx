import { ipcRenderer } from 'electron';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Modal, Input, Typography, Form } from 'antd';
import { GET_SAVED_USER_DATA_FILE, SUCCESS, USER_DATA_RETURN } from '../../../constants';
import { saveUserKey } from '../../utils';
import styles from './index.module.scss';

const isProd: boolean = process.env.NODE_ENV === 'production';

function Apply() {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [saveDisabled, setSaveDisabled] = useState<boolean>(false);

  const [keys, setKeys] = useState({ accessKey: '', secretKey: '' });
  const handleChangeKey = (key: keyof typeof keys, value: string) => {
    setKeys((pre) => ({ ...pre, [key]: value }));
    setSaveDisabled(false);
  };

  const saveUserData = useCallback(() => {
    if (!keys.accessKey || !keys.secretKey) {
      setModalVisible(true);
      setModalMessage('값을 입력해주세요');
      return;
    }

    saveUserKey(
      keys,
      () => setModalVisible(true),
      () => setModalMessage('저장 성공'),
      () => setModalMessage('저장 실패'),
    );
  }, [keys.accessKey, keys.secretKey]);

  useEffect(() => {
    const init = () => {
      ipcRenderer.send(GET_SAVED_USER_DATA_FILE, {});
      ipcRenderer.on(USER_DATA_RETURN, (_, arg) => {
        console.log('argggg', arg);
        if (arg.status === SUCCESS) {
          const newKeys = {
            accessKey: arg?.userData?.accessKey,
            secretKey: arg?.userData?.secretKey,
          };
          setKeys(newKeys);
          setSaveDisabled(true);
        }
      });
    };

    init();
  }, []);

  return (
    <React.Fragment>
      <Typography.Title level={2}>api 키 등록</Typography.Title>
      <Form
        className={styles.form}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        layout="vertical"
        onFinish={saveUserData}
        autoComplete="off"
      >
        <Form.Item style={{ width: '100%', maxWidth: '400px' }} label="Access Key">
          <Input
            style={{ height: '3em' }}
            value={keys.accessKey}
            onChange={(e) => handleChangeKey('accessKey', e.target.value)}
          />
        </Form.Item>
        <Form.Item style={{ width: '100%', maxWidth: '400px' }} label="Secret Key">
          <Input.Password
            style={{ height: '3em' }}
            visibilityToggle={false}
            value={keys.secretKey}
            onChange={(e) => handleChangeKey('secretKey', e.target.value)}
            onFocus={() => handleChangeKey('secretKey', '')}
          />
        </Form.Item>
        <Button
          style={{ marginTop: '3rem', width: '100%', maxWidth: '400px', height: '50px' }}
          disabled={saveDisabled}
          className="mt-4"
          onClick={saveUserData}
        >
          저장
        </Button>
      </Form>
      <div>
        <Modal
          title={modalMessage}
          open={modalVisible}
          onOk={() => setModalVisible(false)}
          onCancel={() => setModalVisible(false)}
        />
      </div>
    </React.Fragment>
  );
}

export default Apply;
