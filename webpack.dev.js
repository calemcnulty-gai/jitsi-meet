const baseConfig = require('./webpack.config.js');

// Override the dev server configuration to listen on all interfaces
const devConfig = baseConfig.getDevServerConfig();
devConfig.host = '0.0.0.0';
devConfig.allowedHosts = 'all';  // Allow all hosts to connect

module.exports = {
    ...baseConfig,
    devServer: devConfig
}; 