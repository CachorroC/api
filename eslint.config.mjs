import { defineConfig } from 'eslint/config';

export default defineConfig( [
  {
    rules: {
      'array-bracket-newline': [
        'error',
        {
          minItems: 1,
        }
      ],

      'array-bracket-spacing': [
        'error',
        'always'
      ],

      'array-callback-return': [
        'error',
        {
          checkForEach: true,
        }
      ],

      'max-statements-per-line': 'error',

      'array-element-newline': [
        'error',
        {
          minItems : 1,
          multiline: true,
        }
      ],

      'arrow-body-style': [
        'error',
        'always'
      ],
      'arrow-spacing': 'error',
      'brace-style'  : 'error',

      'comma-spacing': [
        'error',
        {
          after : true,
          before: false,
        }
      ],

      'computed-property-spacing': [
        'error',
        'always'
      ],
      'consistent-return': 'error',
      curly              : 'error',
      'func-call-spacing': [
        'error',
        'never'
      ],

      'function-paren-newline': [
        'error',
        {
          minItems: 2,
        }
      ],

      'getter-return': 'error',

      'prefer-destructuring': [
        'error',
        {
          array : true,
          object: true,
        },
        {
          enforceForRenamedProperties: false,
        }
      ],

      indent: [
        'error',
        2,
        {
          ArrayExpression: 1,

          CallExpression: {
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

          ImportDeclaration       : 1,
          MemberExpression        : 1,
          ObjectExpression        : 1,
          SwitchCase              : 2,
          VariableDeclarator      : 1,
          offsetTernaryExpressions: true,
        }
      ],

      'key-spacing': [
        'error',
        {
          align: 'colon',
        }
      ],

      'linebreak-style': [
        'error',
        'unix'
      ],
      'multiline-ternary': [
        'error',
        'always'
      ],

      'newline-per-chained-call': [
        'error',
        {
          ignoreChainWithDepth: 1,
        }
      ],

      'no-dupe-args'   : 'error',
      'no-dupe-else-if': 'error',

      'no-else-return': [
        'error',
        {
          allowElseIf: true,
        }
      ],

      'no-unreachable': 'error',

      'object-curly-newline': [
        'error',
        {
          ExportDeclaration: {
            consistent   : true,
            minProperties: 1,
            multiline    : true,
          },

          ImportDeclaration: 'never',

          ObjectExpression: {
            consistent   : true,
            minProperties: 1,
            multiline    : true,
          },

          ObjectPattern: {
            consistent   : true,
            minProperties: 1,
            multiline    : true,
          },
        }
      ],

      'object-curly-spacing': [
        'error',
        'always'
      ],
      'object-property-newline': 'error',
      'operator-linebreak'     : [
        'error',
        'before'
      ],

      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',

          next: [
            'export',
            'case',
            'if',
            'iife',
            'return',
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

          prev: [
            'block',
            'block-like',
            'for',
            'const',
            'if',
            'continue',
            'return',
            'throw',
            'break',
          ],
        }
      ],

      quotes: [
        'error',
        'single'
      ],
      semi             : 'error',
      'space-in-parens': [
        'error',
        'always'
      ],
      'space-before-blocks'   : 'error',
      'keyword-spacing'       : 'error',
      'template-curly-spacing': [
        'error',
        'always'
      ],
      'template-tag-spacing': [
        'error',
        'always'
      ],
    },
  }
] );