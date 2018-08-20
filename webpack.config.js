const path = require("path");
const fs = require("fs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

function src(name) {
  return path.join(__dirname, "src", name);
}

function dist(name) {
  return path.join(__dirname, "dist", name);
}

function np(name) {
  const fpath = require.resolve(name);
  return fpath;
}
function npmin(name) {
  const fpath = require.resolve(name);
  const basePath = fpath.substring(0, fpath.length - 3); // remove ".js" suffix
  const minPath = `${basePath}.min.js`;
  if (fs.existsSync(minPath)) {
    return minPath;
  } else {
    return fpath;
  }
}

module.exports = {
  mode: "development",
  resolve: {
    extensions: [".js", ".ts", ".json", ".njk"],
    alias: {
      "@": path.join(__dirname, "src")
    }
  },
  entry: {
    background: src("background.ts"),
    options: src("pages/options.ts"),
    all: src("all.ts"),
    reply: src("reply/v2ex_reply.ts"),
    new: src("new/v2ex_new.ts"),
    collect: src("collect/v2ex_collect.ts"),
    home: src("home/v2ex_home.ts")
  },
  output: {
    filename: "[name].bundle.js",
    chunkFilename: "[id].bundle.js",
    path: path.join(__dirname, "dist")
  },
  resolveLoader: {
    modules: ["node_modules", path.resolve(__dirname, "loaders")]
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: "ts-loader" },
      { test: /\.njk$/, use: ["raw-loader", "nunjucks-html-loader"] },
      { test: /\.nunjucks$/, use: ["raw-loader", "nunjucks-html-loader"] },
      { test: /\.html$/, use: ["html-loader"] },
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: "url-loader",
        options: {
          limit: 100000
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(["dist"]),
    new CopyWebpackPlugin([
      {
        from: src("manifest.json"),
        transform: (content, path) => {
          // generates the manifest file using the package.json informations
          return Buffer.from(
            JSON.stringify(
              {
                version: process.env.npm_package_version,
                ...JSON.parse(content.toString())
              },
              null,
              2
            )
          );
        }
      },
      {
        from: "img",
        to: dist("img"),
        toType: "dir"
      },
      {
        from: "icon",
        to: dist("icon"),
        toType: "dir"
      },
      {
        from: npmin("jquery")
      }
    ]),
    new HtmlWebpackPlugin({
      template: src("pages/options.nunjucks"),
      filename: "options.html",
      chunks: ["options"]
    })
  ]
};
