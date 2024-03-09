import React from 'react';
import '../styles/global.scss';

import { RecoilRoot } from 'recoil';
import RootLayout from '../layout/layout';

function MyApp({ Component, pageProps }) {
  return (
    <React.Fragment>
      <RecoilRoot>
        <RootLayout>
          <Component {...pageProps} />
        </RootLayout>
      </RecoilRoot>
    </React.Fragment>
  );
}

export default MyApp;
