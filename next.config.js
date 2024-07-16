const withTM = require('next-transpile-modules')(['@ant-design/icons', 'antd', 'rc-pagination', 'rc-picker', 'rc-util']);

module.exports = withTM({
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
});