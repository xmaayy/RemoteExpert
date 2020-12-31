const path = require('path');

module.exports = {
    entry: './src/dssclient.ts',
   devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ],
    },
    output: {
      filename: 'dssclient.js',
      path: path.resolve(__dirname, 'public'),
    },
  };