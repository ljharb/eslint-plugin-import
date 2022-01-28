import { test, testFilePath, SYNTAX_CASES, testVersion } from '../utils';
import parsers from '../parsers';

import { RuleTester } from 'eslint';
import eslintPkg from 'eslint/package.json';
import semver from 'semver';

import { version as tsParserOld } from 'typescript-eslint-parser/package.json';
import { version as tsParserNew } from '@typescript-eslint/parser/package.json';

const ruleTester = new RuleTester();
const rule = require('rules/export');

ruleTester.run('export', rule, {
  valid: parsers.all([].concat(
    test({
      code: 'import "./malformed.js"',
      features: ['no-babel', 'no-ts-old'],
    }),

    // default
    test({ code: 'var foo = "foo"; export default foo;' }),
    test({ code: 'export var foo = "foo"; export var bar = "bar";' }),
    test({ code: 'export var foo = "foo", bar = "bar";' }),
    test({ code: 'export var { foo, bar } = object;' }),
    test({ code: 'export var [ foo, bar ] = array;' }),
    test({ code: 'let foo; export { foo, foo as bar }' }),
    test({ code: 'let bar; export { bar }; export * from "./export-all"' }),
    test({ code: 'export * from "./export-all"' }),
    test({ code: 'export * from "./does-not-exist"' }),

    // #328: "export * from" does not export a default
    test({ code: 'export default foo; export * from "./bar"' }),

    SYNTAX_CASES,

    test({
      code: `
        import * as A from './named-export-collision/a';
        import * as B from './named-export-collision/b';

        export { A, B };
      `,
    }),
    testVersion('>= 6', () => ({
      code: `
        export * as A from './named-export-collision/a';
        export * as B from './named-export-collision/b';
      `,
      features: ['no-ts-old'],
      parserOptions: {
        ecmaVersion: 2020,
      },
    })),

    // type/value name clash
    test({
      code: `
        export const Foo = 1;
        export type Foo = number;
      `,
      features: ['types', 'no-babel-old'],
    }),

    test({
      code: `
        export const Foo = 1;
        export interface Foo {}
      `,
      features: ['types', 'no-babel-old'],
    }),

    // works on ts-old v22
    test({
      code: `
        export function fff(a: string);
        export function fff(a: number);
      `,
      features: ['ts', 'no-ts-old', 'no-babel-old'],
    }),

    // works on ts-old v22
    test({
      code: `
        export function fff(a: string);
        export function fff(a: number);
        export function fff(a: string|number) {};
      `,
      features: ['ts', 'no-ts-old', 'no-babel-old'],
    }),

    // namespace
    test({
      code: `
        export const Bar = 1;
        export namespace Foo {
          export const Bar = 1;
        }
      `,
      features: ['ts', 'no-babel-old'],
    }),
    test({
      code: `
        export type Bar = string;
        export namespace Foo {
          export type Bar = string;
        }
      `,
      features: ['ts', 'no-babel-old'],
    }),
    test({
      code: `
        export const Bar = 1;
        export type Bar = string;
        export namespace Foo {
          export const Bar = 1;
          export type Bar = string;
        }
      `,
      features: ['ts', 'no-babel-old'],
    }),
    test({
      code: `
        export namespace Foo {
          export const Foo = 1;
          export namespace Bar {
            export const Foo = 2;
          }
          export namespace Baz {
            export const Foo = 3;
          }
        }
      `,
      features: ['ts', 'no-babel-old'],
    }),
    test({
      code: 'export * from "./file1.ts"',
      filename: testFilePath('typescript-d-ts/file-2.ts'),
      features: ['ts', 'no-babel-old'],
    }),

    // Exports in ambient modules
    test({
      code: `
        declare module "a" {
          const Foo = 1;
          export {Foo as default};
        }
        declare module "b" {
          const Bar = 2;
          export {Bar as default};
        }
      `,
      features: ['ts', 'no-babel-old'],
    }),
    test({
      code: `
        declare module "a" {
          const Foo = 1;
          export {Foo as default};
        }
        const Bar = 2;
        export {Bar as default};
      `,
      features: ['ts', 'no-babel-old'],
    }),

    (semver.satisfies(process.version, '< 8') && semver.satisfies(eslintPkg.version, '< 6') ? [] : test({
      code: `
        export * from './module';
      `,
      filename: testFilePath('export-star-4/index.js'),
      settings: {
        'import/extensions': ['.js', '.ts', '.jsx'],
      },
    })),
  )),

  invalid: parsers.all([].concat(
    // multiple defaults
    // test({
    //   code: 'export default foo; export default bar',
    //   errors: ['Multiple default exports.', 'Multiple default exports.'],
    // }),
    // test({
    //   code: 'export default function foo() {}; ' +
    //              'export default function bar() {}',
    //   errors: ['Multiple default exports.', 'Multiple default exports.'],
    // }),

    // test({
    //   code: 'export function foo() {}; ' +
    //              'export { bar as foo }',
    //   errors: ['Parsing error: Duplicate export \'foo\''],
    // }),
    // test({
    //   code: 'export {foo}; export {foo};',
    //   errors: ['Parsing error: Duplicate export \'foo\''],
    // }),
    // test({
    //   code: 'export {foo}; export {bar as foo};',
    //   errors: ['Parsing error: Duplicate export \'foo\''],
    // }),
    // test({
    //   code: 'export var foo = "foo"; export var foo = "bar";',
    //   errors: ['Parsing error: Duplicate export \'foo\''],
    // }),
    // test({
    //   code: 'export var foo = "foo", foo = "bar";',
    //   errors: ['Parsing error: Duplicate export \'foo\''],
    // }),
    test({
      code: 'let foo; export { foo }; export * from "./export-all"',
      features: [].concat(
        semver.satisfies(tsParserNew, '< 4') ? 'no-ts-new' : [],
        semver.satisfies(tsParserOld, '^20') ? 'no-ts-old' : [],
      ),
      errors: [
        'Multiple exports of name \'foo\'.',
        'Multiple exports of name \'foo\'.',
      ],
    }),

    // note: Espree bump to Acorn 4+ changed this test's error message.
    //       `npm up` first if it's failing.
    test({
      code: 'export * from "./malformed.js";',
      features: ['no-ts-new', 'no-ts-old', 'no-babel'],
      errors: [
        {
          message: "Parse errors in imported module './malformed.js': 'return' outside of function (1:1)",
          type: 'Literal',
        },
      ],
    }),

    // test({
    //   code: 'export var { foo, bar } = object; export var foo = "bar"',
    //   errors: ['Parsing error: Duplicate export \'foo\''],
    // }),
    // test({
    //   code: 'export var { bar: { foo } } = object; export var foo = "bar"',
    //   errors: ['Parsing error: Duplicate export \'foo\''],
    // }),
    // test({
    //   code: 'export var [ foo, bar ] = array; export var bar = "baz"',
    //   errors: ['Parsing error: Duplicate export \'bar\''],
    // }),
    // test({
    //   code: 'export var [ foo, /*sparse*/, { bar } ] = array; export var bar = "baz"',
    //   errors: ['Parsing error: Duplicate export \'bar\''],
    // }),


    // #328: "export * from" does not export a default
    test({
      code: 'export * from "./default-export"',
      features: [].concat(
        semver.satisfies(tsParserNew, '< 4') ? 'no-ts-new' : [],
        semver.satisfies(tsParserOld, '^20') ? 'no-ts-old' : [],
      ),
      errors: [`No named exports found in module './default-export'.`],
    }),

    // es2022: Arbitrary module namespace identifier names
    test({
      code: 'let foo; export { foo as "foo" }; export * from "./export-all"',
      errors: [
        'Multiple exports of name \'foo\'.',
        'Multiple exports of name \'foo\'.',
      ],
      features: ['arbitrary imports'],
    }),

    // type/value name clash
    test({
      code: `
        export type Foo = string;
        export type Foo = number;
      `,
      features: ['types'],
      errors: [
        {
          message: `Multiple exports of name 'Foo'.`,
          line: 2,
        },
        {
          message: `Multiple exports of name 'Foo'.`,
          line: 3,
        },
      ],
    }),

    // namespace
    test({
      code: `
        export const a = 1
        export namespace Foo {
          export const a = 2;
          export const a = 3;
        }
      `,
      features: ['ts', 'no-babel-old'],
      errors: [
        {
          message: `Multiple exports of name 'a'.`,
          line: 4,
        },
        {
          message: `Multiple exports of name 'a'.`,
          line: 5,
        },
      ],
    }),

    test({
      code: `
        declare module 'foo' {
          const Foo = 1;
          export default Foo;
          export default Foo;
        }
      `,
      features: ['ts', 'no-babel-old'],
      errors: [
        {
          message: 'Multiple default exports.',
          line: 4,
        },
        {
          message: 'Multiple default exports.',
          line: 5,
        },
      ],
    }),
    test({
      code: `
        export namespace Foo {
          export namespace Bar {
            export const Foo = 1;
            export const Foo = 2;
          }
          export namespace Baz {
            export const Bar = 3;
            export const Bar = 4;
          }
        }
      `,
      features: ['ts', 'no-babel-old'],
      errors: [
        {
          message: `Multiple exports of name 'Foo'.`,
          line: 4,
        },
        {
          message: `Multiple exports of name 'Foo'.`,
          line: 5,
        },
        {
          message: `Multiple exports of name 'Bar'.`,
          line: 8,
        },
        {
          message: `Multiple exports of name 'Bar'.`,
          line: 9,
        },
      ],
    }),

    // Exports in ambient modules
    test({
      code: `
        declare module "a" {
          const Foo = 1;
          export {Foo as default};
        }
        const Bar = 2;
        export {Bar as default};
        const Baz = 3;
        export {Baz as default};
      `,
      features: ['ts', 'no-babel'],
      errors: [
        {
          message: 'Multiple default exports.',
          line: 7,
        },
        {
          message: 'Multiple default exports.',
          line: 9,
        },
      ],
    }),
  )),
});
