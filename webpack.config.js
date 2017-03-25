const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: './client/js/main.js',
    output: {
        path: path.resolve(__dirname, 'dist', 'js'),
        publicPath: '/js',
        filename: 'bundle.js'
    },

    devtool: '#source-maps',

    devServer:{
      contentBase: __dirname + '/dist/'
    },

    plugins: [
      new UglifyJSPlugin()
    ],

    module: {
        loaders: [
            { test: /style\/.*\.css$/, loader: 'style!css' }
        ]
    }
};
