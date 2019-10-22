const path = require('path');

module.exports = {
  mode: 'development',
  entry: path.join(__dirname, 'app/scripts/newtab.js'),
  output: {
    path: path.join(__dirname, '/dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_moduls/,
        use: [
          {
            loader: 'babel-loader'
          }
        ]
      }
    ]
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.js']
  }
};
