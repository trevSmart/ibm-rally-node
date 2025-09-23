import js from "@eslint/js";
import babelParser from "@babel/eslint-parser";

export default [
  js.configs.recommended,
  {
    ignores: ["dist/**/*", "node_modules/**/*"]
  },
  {
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-env"]
        }
      },
      globals: {
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Promise: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        global: "readonly"
      }
    },
    rules: {
      "no-prototype-builtins": "off"
    }
  },
  {
    files: ["spec/**/*.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        before: "readonly",
        after: "readonly",
        fail: "readonly"
      }
    }
  }
];