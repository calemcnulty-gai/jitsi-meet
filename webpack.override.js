const config = require('./webpack.config.js');

// Override the dev server host configuration
const originalDevServerConfig = config.getDevServerConfig;
config.getDevServerConfig = function() {
    const devServer = originalDevServerConfig.call(this);
    devServer.host = '0.0.0.0';
    devServer.allowedHosts = 'all';
    return devServer;
};

module.exports = config; 