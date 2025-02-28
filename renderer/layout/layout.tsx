import { Layout, Menu } from 'antd';
import { MenuProps } from 'antd/lib/menu';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { TOP_NAV_MENU } from '../constants';

const { Header, Footer, Content } = Layout;

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
    const routingIndex = TOP_NAV_MENU.findIndex((item) => item.key === +info.key);
    router.push(`/${TOP_NAV_MENU[routingIndex].path}`);
  };

  useEffect(() => {
    const newSelectedKey = [String(TOP_NAV_MENU.findIndex((item) => `/${item.path}` === router.asPath))];
    setSelectedKeys(newSelectedKey);
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
          items={TOP_NAV_MENU}
          style={{ flex: 1, minWidth: 0 }}
          onClick={clickMenuHandler}
        />
      </Header>
      <Content style={{ padding: '0 48px' }}>{children}</Content>
      <Footer style={{ textAlign: 'center' }}>Coin Planet ©2024 Created by please-please</Footer>
    </Layout>
  );
}
