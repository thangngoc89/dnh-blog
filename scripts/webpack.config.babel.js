import path from "path"

import webpack from "webpack"
import ExtractTextPlugin from "extract-text-webpack-plugin"

export default ({ config, pkg }) => ({
  ...config.dev && {
    devtool: "cheap-module-eval-source-map",
  },
  module: {
    loaders: [
      { // statinamic requirement
        test: /\.md$/,
        loader: "statinamic/lib/content-loader",
      },
      {
        test: /global\.styles$/,
        loader: ExtractTextPlugin.extract(
          "style-loader",
          "css-loader!postcss-loader",
        ),
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract(
          "style-loader",
          "css-loader" + (
            "?modules"+
            "&localIdentName=" +
            (
              process.env.NODE_ENV === "production"
              ? "[hash:base64:5]"
              : "[local]--[hash:base64:5]"
            ).toString()
          ) + "!" +
          "postcss-loader",
        ),
      },
      {
        test: /content(\/|\\).*\.(html|ico|jpe?g|png|gif)$/,
        loader: "file-loader?name=[path][name].[ext]&context=./content",
      },
      {
        test: /web_modules(\/|\\).*\.(html|ico|jpe?g|png|gif)$/,
        loader: "file-loader",
        query: {
          name: "images/[path][name].[ext]",
          context: "./web_modules",
        },
      },
      {
        test: /\.svg$/,
        loader: "raw-loader",
      },
    ],
  },

  statinamic: {
    loader: {
      context: path.join(config.cwd, config.source),
      renderer: (html) => html,
      feedsOptions: {
        title: pkg.name,
        site_url: pkg.homepage,
      },
      feeds: {
        "feed.xml": {
          collectionOptions: {
            filter: { layout: "Post" },
            sort: "date",
            reverse: true,
            limit: 20,
          },
        },
      },
    },
  },
  postcss: () => [
    // require("stylelint")(),
    require("postcss-import")(),
    require("postcss-cssnext")({
      browsers: "last 2 versions",
      features: {
        customProperties: {
          variables: {
            fontPrimary: "'Roboto Condensed', Helvetica, Arial, sans-serif",
            fontAccent: "'Open Sans', Helvetica, Arial, sans-serif",
            fontSerif: "'Roboto Slab', Georgia, Times, serif",
          },
        },
        customMedia: {
          extensions: {
            "--lg": "screen and (max-width: 1100px)",
            "--md": "screen and (max-width: 900px)",
            "--sm": "screen and (max-width: 500px)",
          },
        },
      },
    }),
    require("lost")(),
    require("rucksack-css")(),
    require("postcss-browser-reporter")(),
    require("postcss-reporter")(),
  ],

  plugins: [
    new ExtractTextPlugin("[name].[hash].css", { disable: config.dev }),
    new webpack.DefinePlugin({ "process.env": {
      NODE_ENV: JSON.stringify(
        config.production ? "production" : process.env.NODE_ENV
      ),
      STATINAMIC_PATHNAME: JSON.stringify(process.env.STATINAMIC_PATHNAME),
    } }),
    ...config.production && [
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false,
        },
      }),
    ],
  ],

  output: {
    path: path.join(config.cwd, config.destination),
    publicPath: config.baseUrl.pathname,
    filename: "[name].[hash].js",
  },

  resolve: {
    extensions: [ ".js", ".json", "" ],
    root: [ path.join(config.cwd, "node_modules") ],
  },
  resolveLoader: { root: [ path.join(config.cwd, "node_modules") ] },
})
