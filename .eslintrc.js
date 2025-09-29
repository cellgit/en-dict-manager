module.exports = {
  root: true,
  extends: ["next", "next/core-web-vitals"],
  parserOptions: {
    project: "./tsconfig.json"
  },
  plugins: ["@typescript-eslint", "jest", "testing-library"],
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "jest/no-disabled-tests": "warn",
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
    "testing-library/no-node-access": "off"
  },
  overrides: [
    {
      files: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],
      env: {
        jest: true
      }
    }
  ]
};
