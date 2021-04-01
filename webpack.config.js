const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

const buildPath = path.resolve(__dirname, 'dist');

const server = {
  entry: './src/server/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({ 'global.GENTLY': false }),
    new CopyPlugin({
      patterns: [
        { from: 'src/nui', to: 'nui' },
        { from: 'src/locales', to: 'locales' },
        { from: 'src/config.json', to: 'config.json' },
      ],
    }),
  ],
  optimization: {
    minimize: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'server.js',
    path: buildPath,
  },
  target: 'node',
};

const client = {
  entry: './src/client/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'client.js',
    path: buildPath,
  },
};

module.exports = [server, client];
