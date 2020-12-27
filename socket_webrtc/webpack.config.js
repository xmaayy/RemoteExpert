module.exports = [
  {
    mode: 'development',
    entry: './src/dssclient.ts',
    target: 'web',
    module: {
      rules: [{
        test: /\.ts$/,
        include: /src/,
        use: [{ loader: 'ts-loader' }]
      }]
    },
    output: {
      path: __dirname + '/public',
      filename: 'dssclient.js'
    }
  }
];