const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
   mode: 'production',
   entry: './src/public/js/customActivity.js',
   output: {
     filename: 'customActivity.js',
   },
   resolve: {
    extensions: ['.ts', '.js'],
  },
   plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/public/assets", to: path.resolve(__dirname, 'dist', 'public') },
        { from: "src/public/js", to: path.resolve(__dirname, 'dist', 'public', 'js') },
      ],
    }),
  ],
  module: {
    rules: [  
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ]
},  
};
