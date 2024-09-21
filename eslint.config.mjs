import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@stylistic/array-bracket-newline": ["error", { minItems: 1 }],
      "@stylistic/array-bracket-spacing": ["error", "always"],
      "array-callback-return": [
        "error",
        {
          checkForEach: true,
        },
      ],
      "@stylistic/array-element-newline": [
        "error",
        {
          minItems: 1,
          multiline: true,
        },
      ],
      "arrow-body-style": ["error", "always"],
      "@stylistic/arrow-spacing": "error",
      "@stylistic/block-spacing": "error",
      "@stylistic/brace-style": ["error", "stroustrup"],
      "@stylistic/comma-spacing": [
        "error",
        {
          after: true,
          before: false,
        },
      ],
      "@stylistic/computed-property-spacing": ["error", "always"],

      "consistent-return": "error",
      curly: "error",
      "@stylistic/func-call-spacing": ["error", "never"],
      "@stylistic/function-paren-newline": [
        "error",
        {
          minItems: 1,
        },
      ],
      "getter-return": "error",
      "@stylistic/indent": [
        "error",
        2,
        {
          ArrayExpression: 1,
          CallExpression: {
            arguments: 1,
          },
          FunctionDeclaration: {
            body: 1,
            parameters: "first",
          },
          FunctionExpression: {
            body: 1,
            parameters: "first",
          },
          StaticBlock: { body: 2 },
          ImportDeclaration: 1,
          MemberExpression: 1,
          ObjectExpression: 1,
          offsetTernaryExpressions: true,
          SwitchCase: 2,
          VariableDeclarator: "first",
        },
      ],
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
