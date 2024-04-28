import { Layout, Menu } from 'antd';
import { MenuProps } from 'antd/lib/menu';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import logo from '../public/logo.png';
import Link from 'next/link';

const { Content } = Layout;

const items = [
  {
    key: 0,
    label: '종목손익',
    path: 'main',
  },
  {
    key: 1,
    label: 'api 키 등록',
    path: 'apply',
  },
  {
    key: 2,
    label: '주문하기',
    path: 'order',
  },
];
const { Header, Footer } = Layout;
type Props = {
  children: React.ReactNode;
};
export default function RootLayout({ children }: Props) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['0']);
  const router = useRouter();

  const clickLogoHandler = () => {
    router.push('/main');
  };

  const clickMenuHandler: MenuProps['onClick'] = (info) => {
    router.push(`/${items[items.findIndex((item) => item.key === +info.key)].path}`);
  };

  useEffect(() => {
    setSelectedKeys([String(items.findIndex((item) => `/${item.path}` === router.asPath))]);
  }, [router.asPath]);

  return (
    <Layout>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div onClick={clickLogoHandler}>
          <img className="logo" src="/logo.png" />
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={selectedKeys}
          items={items}
          style={{ flex: 1, minWidth: 0 }}
          onClick={clickMenuHandler}
        />
      </Header>
      <Content style={{ padding: '0 48px' }}>{children}</Content>
      <Footer style={{ textAlign: 'center' }}>Coin Planet ©2024 Created by please-please</Footer>
    </Layout>
  );
}
