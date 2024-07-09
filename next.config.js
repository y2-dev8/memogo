const withTM = require('next-transpile-modules')(['@ant-design/icons', 'antd', 'rc-pagination', 'rc-picker']);

module.exports = withTM({
  reactStrictMode: true,
});