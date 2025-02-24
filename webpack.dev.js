const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.js');

module.exports = merge(baseConfig, {
    devServer: {
        host: '0.0.0.0',
        port: 8080,
        allowedHosts: 'all',
        client: {
            overlay: {
                errors: true,
                warnings: false
            }
        },
        hot: true,
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    }
}); 