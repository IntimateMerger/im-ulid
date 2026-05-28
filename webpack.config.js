const path = require('path');

module.exports = {
  mode: 'production',
  target: ['web', 'es5'],
  entry: {
    'im-ulid': path.resolve(__dirname, './src/im-ulid.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist/'),
    libraryTarget: 'commonjs',
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.build.json',
          },
        },
      },
    ],
  },
  devServer: {
    host: '0.0.0.0',
    contentBase: path.resolve(__dirname, './public'),
    publicPath: '/js/',
  },
};
