const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.server = {
  port: 8081,
  host: '0.0.0.0',
  enhanceMiddleware: (middleware) => {
    return middleware;
  },
};

module.exports = config;
