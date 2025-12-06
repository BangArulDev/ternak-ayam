const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./src/frontend/js/app.js",
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
    new HtmlWebpackPlugin({
      template: "./src/frontend/public/index.html",
      filename: "index.html",
      minify: false,
    }),
    new HtmlWebpackPlugin({
      template: "./src/frontend/public/login.html",
      filename: "login.html",
      minify: false,
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "./src/frontend/public/manifest.json", to: "manifest.json" },
        {
          from: "./src/frontend/js/service-worker.js",
          to: "service-worker.js",
        },
      ],
    }),
  ],
};
