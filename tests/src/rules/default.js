import path from 'path';
import { test, SYNTAX_CASES } from '../utils';
import parsers from '../parsers';
import { RuleTester } from 'eslint';
import semver from 'semver';
import { version as tsParserNew } from '@typescript-eslint/parser/package.json';
import { version as tsParserOld } from 'typescript-eslint-parser/package.json';

import { CASE_SENSITIVE_FS } from 'eslint-module-utils/resolve';

const ruleTester = new RuleTester();
const rule = require('rules/default');

ruleTester.run('default', rule, {
  valid: parsers.all([].concat(
    test({ code: 'import "./malformed.js"' }),

    test({ code: 'import foo from "./empty-folder";' }),
    test({ code: 'import { foo } from "./default-export";' }),
    test({ code: 'import foo from "./default-export";' }),
    test({ code: 'import foo from "./mixed-exports";' }),
    test({ code: 'import bar from "./default-export";' }),
    test({ code: 'import CoolClass from "./default-class";' }),
    test({ code: 'import bar, { baz } from "./default-export";' }),

    // core modules always have a default
    test({ code: 'import crypto from "crypto";' }),

    test({ code: 'import common from "./common";' }),

    // es7 export syntax
    test({
      code: 'export bar from "./bar"',
      features: ['no-default', 'no-ts'],
    }),
    test({ code: 'export { default as bar } from "./bar"' }),
    test({
      code: 'export bar, { foo } from "./bar"',
      features: ['no-default', 'no-ts'],
    }),
    test({ code: 'export { default as bar, foo } from "./bar"' }),
    test({
      code: 'export bar, * as names from "./bar"',
      features: ['no-default', 'no-ts'],
    }),

    // sanity check
    test({ code: 'export {a} from "./named-exports"' }),
    test({
      code: 'import twofer from "./trampoline"',
      features: ['no-default', 'no-ts'],
    }),

    // jsx
    test({ code: 'import MyCoolComponent from "./jsx/MyCoolComponent.jsx"' }),

    // #54: import of named export default
    test({ code: 'import foo from "./named-default-export"' }),

    // #94: redux export of execution result,
    test({ code: 'import connectedApp from "./redux"' }),
    test({
      code: 'import App from "./jsx/App"',
    }),

    // from no-errors
    test({
      code: "import Foo from './jsx/FooES7.js';",
      features: ['no-default'],
    }),

    // #545: more ES7 cases
    test({
      code: "import bar from './default-export-from.js';",
      features: ['no-default', 'no-ts'],
    }),
    test({
      code: "import bar from './default-export-from-named.js';",
    }),
    test({
      code: "import bar from './default-export-from-ignored.js';",
      settings: { 'import/ignore': ['common'] },
    }),
    test({
      code: "export bar from './default-export-from-ignored.js';",
      settings: { 'import/ignore': ['common'] },
      features: ['no-default', 'no-ts'],
    }),

    test({
      code: 'export { "default" as bar } from "./bar"',
      features: ['arbitrary imports'],
    }),

    SYNTAX_CASES,

    // #311: import of mismatched case
    CASE_SENSITIVE_FS ? [] : test({
      code: 'import foo from "./jsx/MyUncoolComponent.jsx"',
    }),

    test({
      code: `import foobar from "./typescript-default"`,
      features: ['ts'],
    }),
    test({
      code: `import foobar from "./typescript-export-assign-default"`,
      features: ['ts'],
    }),
    test({
      code: `import foobar from "./typescript-export-assign-function"`,
      features: ['ts'],
    }),
    semver.satisfies(tsParserOld, '>= 22') ? test({
      code: `import foobar from "./typescript-export-assign-mixed"`,
      features: ['ts'],
    }) : [],
    test({
      code: `import foobar from "./typescript-export-assign-default-reexport"`,
      features: ['ts'],
    }),
    test({
      code: `import React from "./typescript-export-assign-default-namespace"`,
      features: ['ts'],
      parserOptions: {
        tsconfigRootDir: path.resolve(__dirname, '../../files/typescript-export-assign-default-namespace/'),
      },
    }),
    test({
      code: `import Foo from "./typescript-export-as-default-namespace"`,
      features: ['ts'],
      parserOptions: {
        tsconfigRootDir: path.resolve(__dirname, '../../files/typescript-export-as-default-namespace/'),
      },
    }),
    test({
      code: `import Foo from "./typescript-export-react-test-renderer"`,
      features: ['ts'],
      parserOptions: {
        tsconfigRootDir: path.resolve(__dirname, '../../files/typescript-export-react-test-renderer/'),
      },
    }),
    test({
      code: `import Foo from "./typescript-extended-config"`,
      features: ['ts'],
      parserOptions: {
        tsconfigRootDir: path.resolve(__dirname, '../../files/typescript-extended-config/'),
      },
    }),
    test({
      code: `import foobar from "./typescript-export-assign-property"`,
      features: ['ts'],
    }),
  )),

  invalid: parsers.all([].concat(
    test({
      code: "import Foo from './jsx/FooES7.js';",
      features: ['no-ts', 'no-babel'],
      errors: ["Parse errors in imported module './jsx/FooES7.js': Unexpected token = (6:16)"],
    }),

    test({
      code: 'import baz from "./named-exports";',
      features: [].concat(
        semver.satisfies(tsParserNew, '< 4') ? 'no-ts-new' : [],
        semver.satisfies(tsParserOld, '< 22') ? 'no-ts-old' : [],
      ),
      errors: [
        { 
          message: 'No default export found in imported module "./named-exports".',
          type: 'ImportDefaultSpecifier', 
        },
      ],
    }),

    // es7 export syntax
    test({
      code: 'export baz from "./named-exports"',
      features: ['no-default', 'no-ts'],
      errors: ['No default export found in imported module "./named-exports".'],
    }),
    test({
      code: 'export baz, { bar } from "./named-exports"',
      features: ['no-default', 'no-ts'],
      errors: ['No default export found in imported module "./named-exports".'],
    }),
    test({
      code: 'export baz, * as names from "./named-exports"',
      features: ['no-default', 'no-ts'],
      errors: ['No default export found in imported module "./named-exports".'],
    }),
    // exports default from a module with no default
    test({
      code: 'import twofer from "./broken-trampoline"',
      features: ['no-default', 'no-ts'],
      errors: ['No default export found in imported module "./broken-trampoline".'],
    }),

    // #328: * exports do not include default
    test({
      code: 'import barDefault from "./re-export"',
      features: [].concat(
        semver.satisfies(tsParserNew, '< 4') ? 'no-ts-new' : [],
        semver.satisfies(tsParserOld, '< 22') ? 'no-ts-old' : [],
      ),
      errors: ['No default export found in imported module "./re-export".'],
    }),

    // #311: import of mismatched case
    CASE_SENSITIVE_FS ? [] : test({
      code: 'import bar from "./Named-Exports"',
      features: [].concat(
        semver.satisfies(tsParserNew, '< 4') ? 'no-ts-new' : [],
        semver.satisfies(tsParserOld, '< 22') ? 'no-ts-old' : [],
      ),
      errors: ['No default export found in imported module "./Named-Exports".'],
    }),

    test({
      code: `import foobar from "./typescript"`,
      features: ['ts', 'no-babel-old'],
      errors: ['No default export found in imported module "./typescript".'],
    }),
    test({
      code: `import React from "./typescript-export-assign-default-namespace"`,
      features: ['ts', 'no-babel-old'],
      errors: ['No default export found in imported module "./typescript-export-assign-default-namespace".'],
    }),
    test({
      code: `import FooBar from "./typescript-export-as-default-namespace"`,
      features: ['ts', 'no-babel-old'],
      errors: ['No default export found in imported module "./typescript-export-as-default-namespace".'],
    }),
    test({
      code: `import Foo from "./typescript-export-as-default-namespace"`,
      features: ['ts', 'no-babel-old'],
      parserOptions: {
        tsconfigRootDir: path.resolve(__dirname, '../../files/typescript-no-compiler-options/'),
      },
      errors: [
        {
          message: 'No default export found in imported module "./typescript-export-as-default-namespace".',
          line: 1,
          column: 8,
          endLine: 1,
          endColumn: 11,
        },
      ],
    }),
  )),
});
