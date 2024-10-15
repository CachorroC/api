import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default [
  {
    files: [
      '**/*.{js,mjs,cjs,ts}'
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/array-bracket-newline': [
        'error',
        {
          minItems: 1,
        },
      ],
      '@stylistic/array-bracket-spacing': [
        'error',
        'always'
      ],
      'array-callback-return': [
        'error',
        {
          checkForEach: true,
        },
      ],
      '@stylistic/array-element-newline': [
        'error',
        {
          minItems : 1,
          multiline: true,
        },
      ],
      'arrow-body-style': [
        'error',
        'always'
      ],
      '@stylistic/arrow-spacing': 'error',
      '@stylistic/block-spacing': 'error',
      '@stylistic/brace-style'  : [
        'error',
        'stroustrup'
      ],
      '@stylistic/comma-spacing': [
        'error',
        {
          after : true,
          before: false,
        },
      ],
      '@stylistic/computed-property-spacing': [
        'error',
        'always'
      ],

      'consistent-return'           : 'error',
      curly                         : 'error',
      '@stylistic/func-call-spacing': [
        'error',
        'never'
      ],
      '@stylistic/function-paren-newline': [
        'error',
        {
          minItems: 1,
        },
      ],
      'getter-return'                       : 'error',
      '@stylistic/jsx-child-element-spacing': 'error',
      '@stylistic/indent'                   : [
        'error',
        2,
        {
          ArrayExpression: 1,
          CallExpression : {
            arguments: 1,
          },
          FunctionDeclaration: {
            body      : 1,
            parameters: 'first',
          },
          FunctionExpression: {
            body      : 1,
            parameters: 'first',
          },
          StaticBlock: {
            body: 2,
          },
          ImportDeclaration: 'first',
          MemberExpression : 1,
          ObjectExpression : 1,

          offsetTernaryExpressions: true,
          SwitchCase              : 2,
          VariableDeclarator      : 'first',
        },
      ],
      '@stylistic/key-spacing': [
        'error',
        {
          align: 'colon',
        },
      ],
      '@stylistic/keyword-spacing'        : 'error',
      '@stylistic/max-statements-per-line': 'error',
      '@stylistic/multiline-ternary'      : [
        'error',
        'always'
      ],
      '@stylistic/newline-per-chained-call': [
        'error',
        {
          ignoreChainWithDepth: 1,
        },
      ],
      'no-dupe-args'   : 'error',
      'no-dupe-else-if': 'error',
      'no-else-return' : [
        'error',
        {
          allowElseIf: true,
        },
      ],
      'no-unreachable'                 : 'error',
      '@stylistic/object-curly-spacing': [
        'error',
        'always'
      ],
      '@stylistic/object-curly-newline': [
        'error',
        {
          ExportDeclaration: {
            consistent   : true,
            minProperties: 1,
            multiline    : true,
          },
          ImportDeclaration: 'never',
          ObjectExpression : {
            consistent   : true,
            minProperties: 1,
            multiline    : true,
          },
          ObjectPattern: {
            consistent   : true,
            minProperties: 1,
            multiline    : true,
          },
        },
      ],
      '@stylistic/object-property-newline': 'error',

      'operator-linebreak': [
        'error',
        'before'
      ],
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          next     : [
            'export',
            'case',
            'if',
            'iife',
            'const',
            'class',
            'multiline-block-like',
            'try',
          ],
          prev: '*',
        },
        {
          blankLine: 'always',
          next     : '*',
          prev     : [
            'block',
            'block-like',
            'for',
            'if',
            'continue',
            'return',
            'throw',
            'break',
          ],
        },
      ],
      'prefer-destructuring': [
        'error',
        {
          array : true,
          object: true,
        },
        {
          enforceForRenamedProperties: false,
        },
      ],
      quotes: [
        'error',
        'single'
      ],
      semi                 : 'error',
      'space-before-blocks': 'error',
      'space-in-parens'    : [
        'error',
        'always'
      ],
      'template-curly-spacing': [
        'error',
        'always'
      ],
      'template-tag-spacing': [
        'error',
        'always'
      ],
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
