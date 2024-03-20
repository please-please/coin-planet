import { Layout, Menu } from 'antd';
import { MenuProps } from 'antd/lib/menu';
import { useRouter } from 'next/router';
import React from 'react';

const { Content } = Layout;

const items = [
  {
    key: 1,
    label: 'main',
    path: 'home',
  },
  {
    key: 2,
    label: 'apply',
    path: 'apply',
  },
  {
    key: 3,
    label: 'order',
    path: 'select',
  },
];
const { Header, Footer } = Layout;
type Props = {
  children: React.ReactNode;
};
export default function RootLayout({ children }: Props) {
  const router = useRouter();

  const clickMenuHandler: MenuProps['onClick'] = (info) => {
    router.push(`/${items[items.findIndex((item) => item.key === +info.key)].path}`);
  };

  return (
    <Layout>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div className="demo-logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['1']}
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
