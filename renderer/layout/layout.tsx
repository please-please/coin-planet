import { Layout, Menu } from 'antd';
import React from 'react';

const { Content } = Layout;

const items = [
  {
    key: 1,
    label: 'main',
  },
  {
    key: 2,
    label: 'apply',
  },
  {
    key: 3,
    label: 'order',
  },
];
const { Header, Footer } = Layout;
type Props = {
  children: React.ReactNode;
};
export default function RootLayout({ children }: Props) {
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
          onClick={(e) => {
            e.key === '1'
              ? (window.location.href = 'app://./home.html')
              : (window.location.href = `app://./${e.key}.html`);
          }}
        />
      </Header>
      <Content style={{ padding: '0 48px' }}>{children}</Content>
      <Footer style={{ textAlign: 'center' }}>Ant Design ©{new Date().getFullYear()} Created by Ant UED</Footer>
    </Layout>
  );
}
