const dotenv = require('dotenv-webpack');
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = 'electron-renderer';
    }
    config.plugins.push(new dotenv({ path: isProd ? '.env.production' : '.env.development' }));
    return config;
  },
  reactStrictMode: false,
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api',
  //       destination: `${process.env.SERVER_URL}/graphql`,
  //     },
  //   ];
  // },
};
