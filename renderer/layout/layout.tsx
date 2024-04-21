import { Layout, Menu } from 'antd';
import { MenuProps } from 'antd/lib/menu';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const { Content } = Layout;

const items = [
  {
    key: 0,
    label: 'main',
    path: 'main',
  },
  {
    key: 1,
    label: 'apply',
    path: 'apply',
  },
  {
    key: 2,
    label: 'order',
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

  const clickMenuHandler: MenuProps['onClick'] = (info) => {
    router.push(`/${items[items.findIndex((item) => item.key === +info.key)].path}`);
  };

  useEffect(() => {
    setSelectedKeys([String(items.findIndex((item) => `/${item.path}` === router.asPath))]);
  }, [router.asPath]);

  return (
    <Layout>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div className="demo-logo" />
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
      <Footer style={{ textAlign: 'center' }}>Ant Design ©{new Date().getFullYear()} Created by Ant UED</Footer>
    </Layout>
  );
}
