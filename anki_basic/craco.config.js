const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const path = require("path");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins || [];
      webpackConfig.resolve.plugins.push(
        new TsconfigPathsPlugin({
          extensions: webpackConfig.resolve.extensions,
        })
      );

      // Configure webpack to handle .wasm files (required for sql.js)
      // See https://github.com/webpack/webpack/issues/6725
      webpackConfig.module.rules.push({
        test: /\.wasm$/,
        type: "javascript/auto",
      });

      // Add fallbacks for Node.js modules that sql.js tries to import
      // but are not needed in browser environment
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };

      // Add explicit alias resolution
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        "@": path.resolve(__dirname, "src"),
        "@api": path.resolve(__dirname, "src/api"),
        "@services": path.resolve(__dirname, "src/services"),
        "@scheduler": path.resolve(__dirname, "src/scheduler"),
        "@store": path.resolve(__dirname, "src/store"),
        "@components": path.resolve(__dirname, "src/components"),
        "@pages": path.resolve(__dirname, "src/pages"),
        "@types": path.resolve(__dirname, "src/types"),
      };

      return webpackConfig;
    },
  },
  jest: {
    configure: {
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "^@api/(.*)$": "<rootDir>/src/api/$1",
        "^@services/(.*)$": "<rootDir>/src/services/$1",
        "^@scheduler/(.*)$": "<rootDir>/src/scheduler/$1",
        "^@store/(.*)$": "<rootDir>/src/store/$1",
        "^@components/(.*)$": "<rootDir>/src/components/$1",
        "^@pages/(.*)$": "<rootDir>/src/pages/$1",
        "^@types/(.*)$": "<rootDir>/src/types/$1",
      },
    },
  },
};
