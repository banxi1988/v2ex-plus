const webpack = require("webpack");
const webpackConfig = require("./webpack.config.js");

webpack(webpackConfig, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error(err);
  } else {
    console.info("Compile Done");
  }
});
