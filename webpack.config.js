const path = require('path');

module.exports = {
  mode: 'production',
  target: ['web', 'es5'],
  entry: {
    'im-ulid': path.resolve(__dirname, './src/im-ulid.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist/'),
    library: 'im-ulid',
    libraryTarget: 'commonjs',
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        use: 'ts-loader',
      },
    ],
  },
};
