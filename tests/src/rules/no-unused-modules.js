import { test, testFilePath, getTSParsers, parsers as p } from '../utils';
import parsers from '../parsers';
import jsxConfig from '../../../config/react';
import typescriptConfig from '../../../config/typescript';

import { RuleTester } from 'eslint';
import fs from 'fs';
import eslintPkg from 'eslint/package.json';
import semver from 'semver';
import { version as tsOldVersion } from 'typescript-eslint-parser/package.json';

// TODO: figure out why these tests fail in eslint 4
const isESLint4TODO = semver.satisfies(eslintPkg.version, '^4');

const ruleTester = new RuleTester();
const typescriptRuleTester = new RuleTester(typescriptConfig);
const jsxRuleTester = new RuleTester(jsxConfig);
const rule = require('rules/no-unused-modules');

const error = message => ({ message });

const missingExportsOptions = [{
  missingExports: true,
}];

const unusedExportsOptions = [{
  unusedExports: true,
  src: [testFilePath('./no-unused-modules/**/*.js')],
  ignoreExports: [testFilePath('./no-unused-modules/*ignored*.js')],
}];

const unusedExportsTypescriptOptions = [{
  unusedExports: true,
  src: [testFilePath('./no-unused-modules/typescript')],
  ignoreExports: undefined,
}];

const unusedExportsJsxOptions = [{
  unusedExports: true,
  src: [testFilePath('./no-unused-modules/jsx')],
  ignoreExports: undefined,
}];

// tests for missing exports
ruleTester.run('no-unused-modules', rule, {
  valid: parsers.all([].concat(
    test({
      code: 'export default function noOptions() {}',
    }),
    test({
      code: 'export default () => 1',
      options: missingExportsOptions,
    }),
    test({
      code: 'export const a = 1',
      options: missingExportsOptions,
    }),
    test({
      code: 'const a = 1; export { a }',
      options: missingExportsOptions,
    }),
    test({
      code: 'function a() { return true }; export { a }',
      options: missingExportsOptions,
    }),
    test({
      code: 'const a = 1; const b = 2; export { a, b }',
      options: missingExportsOptions,
    }),
    test({
      code: 'const a = 1; export default a',
      options: missingExportsOptions,
    }),
    test({
      code: 'export class Foo {}',
      options: missingExportsOptions,
    }),
    test({
      code: 'export const [foobar] = [];',
      options: missingExportsOptions,
    }),
    test({
      code: 'export const [foobar] = foobarFactory();',
      options: missingExportsOptions,
    }),
    test({
      code: `
      export default function NewComponent () {
        return 'I am new component'
      }
      `,
      options: missingExportsOptions,
    }),

    test({
      code: 'import { o2 } from "./file-o";export default () => 12',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-a.js'),
    }),
    test({
      code: 'export const b = 2',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-b.js'),
    }),
    test({
      code: 'const c1 = 3; function c2() { return 3 }; export { c1, c2 }',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-c.js'),
    }),
    test({
      code: 'export function d() { return 4 }',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-d.js'),
    }),
    test({
      code: 'export class q { q0() {} }',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-q.js'),
    }),
    test({
      code: 'const e0 = 5; export { e0 as e }',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-e.js'),
    }),
    test({
      code: 'const l0 = 5; const l = 10; export { l0 as l1, l }; export default () => {}',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-l.js'),
    }),
    test({
      code: 'const o0 = 0; const o1 = 1; export { o0, o1 as o2 }; export default () => {}',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-o.js'),
    }),

    test({
      code: `
        export const a = 10
        export const b = 20
        export const c = 30
        const d = 40
        export default d
      `,
      options: unusedExportsOptions,
      features: ['dynamic import'],
      filename: testFilePath('./no-unused-modules/exports-for-dynamic-js.js'),
    }),

    test({
      code: `
        export const ts_a = 10
        export const ts_b = 20
        export const ts_c = 30
        const ts_d = 40
        export default ts_d
      `,
      options: unusedExportsTypescriptOptions,
      features: ['ts', 'no-babel-old'],
      filename: testFilePath('./no-unused-modules/typescript/exports-for-dynamic-ts.ts'),
    }),

    // test for ignored files
    test({
      code: 'export default () => 14',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-ignored-a.js'),
    }),
    test({
      code: 'export const b = 2',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-ignored-b.js'),
    }),
    test({
      code: 'const c1 = 3; function c2() { return 3 }; export { c1, c2 }',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-ignored-c.js'),
    }),
    test({
      code: 'export function d() { return 4 }',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-ignored-d.js'),
    }),
    test({
      code: 'const f = 5; export { f as e }',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-ignored-e.js'),
    }),
    test({
      code: 'const l0 = 5; const l = 10; export { l0 as l1, l }; export default () => {}',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-ignored-l.js'),
    }),

    // test for export from
    test({
      code: `export { default } from './file-o'`,
      features: ['no-babel-old', 'no-ts-new'], // TODO: FIXME: remove `no-babel-old`, `no-ts-new`
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-s.js'),
    }),

    test({
      code: 'const k0 = 5; export { k0 as k }',
      features: [ // TODO: FIXME: remove `no-default`, `no-babel-old`, `no-ts-new`
        'no-default',
        'no-babel-old',
        'no-ts-new',
      ].concat(semver.satisfies(tsOldVersion, '< 22') ? 'no-ts-old' : []),
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-k.js'),
    }),

    // add named import for file with default export
    test({
      code: `import { f } from '${testFilePath('./no-unused-modules/file-f.js')}'`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-0.js'),
    }),

    // add default import for file with default export
    test({
      code: `import f from '${testFilePath('./no-unused-modules/file-f.js')}'`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-0.js'),
    }),
    test({
      code: 'export default () => 16',
      features: ['no-default', 'no-ts-new', 'no-babel-old'], // TODO: FIXME: remove `no-default`, `no-ts-new`, `no-babel-old`
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-f.js'),
    }),

    // add default import for file with named export
    test({
      code: `import g from '${testFilePath('./no-unused-modules/file-g.js')}';import {h} from '${testFilePath('./no-unused-modules/file-gg.js')}'`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-0.js'),
    }),

    // add named import for file with named export
    test({
      code: `import { g } from '${testFilePath('./no-unused-modules/file-g.js')}'; import eslint from 'eslint'`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-0.js'),
    }),
    test({
      code: 'export const g = 2',
      features: ['no-default', 'no-ts-new', 'no-babel-old'], // TODO: FIXME: remove `no-default`, `no-ts-new`, `no-babel-old`
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-g.js'),
    }),

    // add different named import for file with named export
    test({
      code: `import { c } from '${testFilePath('./no-unused-modules/file-b.js')}'`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-0.js'),
    }),

    // add renamed named import for file with named export
    test({
      code: `import { g as g1 } from '${testFilePath('./no-unused-modules/file-g.js')}'; import eslint from 'eslint'`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-0.js'),
    }),

    // add different renamed named import for file with named export
    test({
      code: `import { g1 as g } from '${testFilePath('./no-unused-modules/file-g.js')}'`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-0.js'),
    }),

    // remove default import for file with default export
    test({
      code: `import { a1, a2 } from '${testFilePath('./no-unused-modules/file-a.js')}'`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-0.js'),
    }),

    test({
      code: `import * as m from '${testFilePath('./no-unused-modules/file-m.js')}'; import unknown from 'unknown-module'`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-0.js'),
    }),

    // remove all exports
    test({
      code: `/* import * as m from '${testFilePath('./no-unused-modules/file-m.js')}' */`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-0.js'),
    }),

    test({
      code: `export * from '${testFilePath('./no-unused-modules/file-m.js')}';`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-0.js'),
    }),

    /* TODO:
    test({
      code: `export { default, m1 } from '${testFilePath('./no-unused-modules/file-m.js')}';`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-0.js')
    }),
    */

    // Test that import and export in the same file both counts as usage
    test({
      code: `export const a = 5;export const b = 't1'`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/import-export-1.js'),
    }),

    test({
      code: `import { "foo" as foo } from "./arbitrary-module-namespace-identifier-name-a"`,
      options: unusedExportsOptions,
      features: ['arbitrary imports'],
      filename: testFilePath('./no-unused-modules/arbitrary-module-namespace-identifier-name-b.js'),
    }),
    test({
      code: 'const foo = 333;\nexport { foo as "foo" }',
      options: unusedExportsOptions,
      features: ['arbitrary imports'],
      filename: testFilePath('./no-unused-modules/arbitrary-module-namespace-identifier-name-a.js'),
    }),

    test({
      code: 'export { default as Component } from "./Component"',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/renameDefault/components.js'),
    }),
    test({
      options: unusedExportsOptions,
      code: 'export default function Component() {}',
      filename: testFilePath('./no-unused-modules/renameDefault/Component.js'),
    }),

    test({
      code: 'export { default as ComponentA } from "./ComponentA";export { default as ComponentB } from "./ComponentB";',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/renameDefault-2/components.js'),
    }),
    test({
      code: 'export default function ComponentA() {};',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/renameDefault-2/ComponentA.js'),
    }),
  )),

  invalid: parsers.all([].concat(
    test({
      code: 'const a = 1',
      options: missingExportsOptions,
      errors: [error(`No exports found`)],
    }),
    test({
      code: '/* const a = 1 */',
      options: missingExportsOptions,
      errors: [error(`No exports found`)],
    }),

    test({
      code: `
        import eslint from 'eslint'
        import fileA from './file-a'
        import { b } from './file-b'
        import { c1, c2 } from './file-c'
        import { d } from './file-d'
        import { e } from './file-e'
        import { e2 } from './file-e'
        import { h2 } from './file-h'
        import * as l from './file-l'
        export * from './file-n'
        export { default, o0, o3 } from './file-o'
        export { p } from './file-p'
        import s from './file-s'
      `,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-0.js'),
      errors: [
        error(`exported declaration 'default' not used within other modules`),
        error(`exported declaration 'o0' not used within other modules`),
        error(`exported declaration 'o3' not used within other modules`),
        error(`exported declaration 'p' not used within other modules`),
      ],
    }),
    test({
      options: unusedExportsOptions,
      code: `const n0 = 'n0'; const n1 = 42; export { n0, n1 }; export default () => {}`,
      filename: testFilePath('./no-unused-modules/file-n.js'),
      errors: [error(`exported declaration 'default' not used within other modules`)],
    }),

    test({
      code: 'export default () => 13',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-f.js'),
      errors: [error(`exported declaration 'default' not used within other modules`)],
    }),
    test({
      code: 'export const g = 2',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-g.js'),
      errors: [error(`exported declaration 'g' not used within other modules`)],
    }),
    test({
      code: 'const h1 = 3; function h2() { return 3 }; const h3 = true; export { h1, h2, h3 }',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-h.js'),
      errors: [error(`exported declaration 'h1' not used within other modules`)],
    }),
    test({
      code: 'const i1 = 3; function i2() { return 3 }; export { i1, i2 }',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-i.js'),
      errors: [
        error(`exported declaration 'i1' not used within other modules`),
        error(`exported declaration 'i2' not used within other modules`),
      ],
    }),
    test({
      code: 'export function j() { return 4 }',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-j.js'),
      errors: [error(`exported declaration 'j' not used within other modules`)],
    }),
    test({
      code: 'export class q { q0() {} }',
      options: unusedExportsOptions,
      features: [
        'no-default',
        'no-ts-new',
        'no-babel-old',
      ].concat(semver.satisfies(tsOldVersion, '< 22') ? 'no-ts-old' : []),
      filename: testFilePath('./no-unused-modules/file-q.js'),
      errors: [error(`exported declaration 'q' not used within other modules`)],
    }),
    test({
      code: 'const k0 = 5; export { k0 as k }',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-k.js'),
      errors: [error(`exported declaration 'k' not used within other modules`)],
    }),

    test({
      code: `
        export const a = 10
        export const b = 20
        export const c = 30
        const d = 40
        export default d
      `,
      options: unusedExportsOptions,
      features: ['dynamic import'],
      filename: testFilePath('./no-unused-modules/exports-for-dynamic-js-2.js'),
      errors: [
        error(`exported declaration 'a' not used within other modules`),
        error(`exported declaration 'b' not used within other modules`),
        error(`exported declaration 'c' not used within other modules`),
        error(`exported declaration 'default' not used within other modules`),
      ],
    }),

    // test for export from
    test({
      code: `export { k } from '${testFilePath('./no-unused-modules/file-k.js')}'`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-j.js'),
      errors: [error(`exported declaration 'k' not used within other modules`)],
    }),

    // add named import for file with default export
    test({
      code: 'export default () => 15',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-f.js'),
      errors: [error(`exported declaration 'default' not used within other modules`)],
    }),

    // add default import for file with named export
    test({
      code: 'export const g = 2',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-g.js'),
      errors: [error(`exported declaration 'g' not used within other modules`)],
    }),

    // add different named import for file with named export
    test({
      code: 'export const b = 2',
      features: [ // TODO: FIXME: remove `no-default`, `no-ts-new`, `no-babel-old`
        'no-default',
        'no-ts-new',
        'no-babel-old',
      ].concat(semver.satisfies(tsOldVersion, '< 22') ? 'no-ts-old' : []),
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-b.js'),
      errors: [error(`exported declaration 'b' not used within other modules`)],
    }),

    // add different renamed named import for file with named export
    test({
      code: 'export const g = 2',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-g.js'),
      errors: [error(`exported declaration 'g' not used within other modules`)],
    }),

    // remove default import for file with default export
    test({
      code: 'export default () => 17',
      features: [ // TODO: FIXME: remove `no-default`, `no-ts-new`, `no-babel-old`
        'no-default',
        'no-ts-new',
        'no-babel-old',
      ].concat(semver.satisfies(tsOldVersion, '< 22') ? 'no-ts-old' : []),
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-a.js'),
      errors: [error(`exported declaration 'default' not used within other modules`)],
    }),

    // add namespace import for file with unused exports
    // remove all exports
    test({
      code: 'const m0 = 5; const m = 10; export { m0 as m1, m }; export default () => {}',
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-m.js'),
      errors: [
        error(`exported declaration 'm1' not used within other modules`),
        error(`exported declaration 'm' not used within other modules`),
        error(`exported declaration 'default' not used within other modules`),
      ],
    }),

    test({
      code: `export { m1, m } from '${testFilePath('./no-unused-modules/file-m.js')}';`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-0.js'),
      errors: [
        error(`exported declaration 'm1' not used within other modules`),
        error(`exported declaration 'm' not used within other modules`),
      ],
    }),

    test({
      code: `export { default, m1 } from '${testFilePath('./no-unused-modules/file-m.js')}';`,
      options: unusedExportsOptions,
      filename: testFilePath('./no-unused-modules/file-0.js'),
      errors: [
        error(`exported declaration 'default' not used within other modules`),
        error(`exported declaration 'm1' not used within other modules`),
      ],
    }),

    test({
      code: 'const foo = 333\nexport { foo as "foo" }',
      options: unusedExportsOptions,
      features: ['arbitrary imports'],
      filename: testFilePath('./no-unused-modules/arbitrary-module-namespace-identifier-name-c.js'),
      errors: [
        error(`exported declaration 'foo' not used within other modules`),
      ],
    }),
  )),
});

describe('test behavior for new file', () => {
  before(() => {
    fs.writeFileSync(testFilePath('./no-unused-modules/file-added-0.js'), '', { encoding: 'utf8' });
  });

  // add import in newly created file
  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({
        code: `import * as m from '${testFilePath('./no-unused-modules/file-m.js')}'`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-added-0.js'),
      }),
      test({
        code: 'const m0 = 5; const m = 10; export { m0 as m1, m }; export default () => {}',
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-m.js'),
      }),
      test({
        code: `import def from '${testFilePath('./no-unused-modules/file-added-0.js')}'`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-0.js'),
      }),
      test({
        code: `export default () => {}`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-added-0.js'),
      }),

      // export * only considers named imports. default imports still need to be reported
      test({
        code: `export * from '${testFilePath('./no-unused-modules/file-added-0.js')}'`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-0.js'),
      }),
      // Test export * from 'external-compiled-library'
      test({
        code: `export * from 'external-compiled-library'`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-r.js'),
      }),

      test({
        code: `export const a = 2`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-added-0.js'),
      }),
    ],
    invalid: [
      // add export for newly created file
      test({
        code: `export default () => {2}`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-added-0.js'),
        errors: [error(`exported declaration 'default' not used within other modules`)],
      }),
      test({
        code: `export const z = 'z';export default () => {}`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-added-0.js'),
        errors: [error(`exported declaration 'default' not used within other modules`)],
      }),
    ],
  });

  // remove export *. all exports need to be reported
  ruleTester.run('no-unused-modules', rule, {
    valid: [],
    invalid: [
      test({
        code: `export { a } from '${testFilePath('./no-unused-modules/file-added-0.js')}'`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-0.js'),
        errors: [error(`exported declaration 'a' not used within other modules`)],
      }),
      test({
        code: `export const z = 'z';export default () => {}`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-added-0.js'),
        errors: [
          error(`exported declaration 'z' not used within other modules`),
          error(`exported declaration 'default' not used within other modules`),
        ],
      }),
    ],
  });


  describe('test behavior for new file', () => {
    before(() => {
      fs.writeFileSync(testFilePath('./no-unused-modules/file-added-1.js'), '', { encoding: 'utf8' });
    });
    ruleTester.run('no-unused-modules', rule, {
      valid: [
        test({
          code: `export * from '${testFilePath('./no-unused-modules/file-added-1.js')}'`,
          options: unusedExportsOptions,
          filename: testFilePath('./no-unused-modules/file-0.js'),
        }),
      ],
      invalid: [
        test({
          code: `export const z = 'z';export default () => {}`,
          options: unusedExportsOptions,
          filename: testFilePath('./no-unused-modules/file-added-1.js'),
          errors: [error(`exported declaration 'default' not used within other modules`)],
        }),
      ],
    });
    after(() => {
      if (fs.existsSync(testFilePath('./no-unused-modules/file-added-1.js'))) {
        fs.unlinkSync(testFilePath('./no-unused-modules/file-added-1.js'));
      }
    });
  });

  after(() => {
    if (fs.existsSync(testFilePath('./no-unused-modules/file-added-0.js'))) {
      fs.unlinkSync(testFilePath('./no-unused-modules/file-added-0.js'));
    }
  });
});

describe('test behavior for new file', () => {
  before(() => {
    fs.writeFileSync(testFilePath('./no-unused-modules/file-added-2.js'), '', { encoding: 'utf8' });
  });
  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({
        code: `import added from '${testFilePath('./no-unused-modules/file-added-2.js')}'`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-added-1.js'),
      }),
      test({
        code: `export default () => {}`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-added-2.js'),
      }),
    ],
    invalid: [],
  });
  after(() => {
    if (fs.existsSync(testFilePath('./no-unused-modules/file-added-2.js'))) {
      fs.unlinkSync(testFilePath('./no-unused-modules/file-added-2.js'));
    }
  });
});

describe('test behavior for new file', () => {
  before(() => {
    fs.writeFileSync(testFilePath('./no-unused-modules/file-added-3.js'), '', { encoding: 'utf8' });
  });
  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({
        code: `import { added } from '${testFilePath('./no-unused-modules/file-added-3.js')}'`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-added-1.js'),
      }),
      test({
        code: `export const added = () => {}`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-added-3.js'),
      }),
    ],
    invalid: [],
  });
  after(() => {
    if (fs.existsSync(testFilePath('./no-unused-modules/file-added-3.js'))) {
      fs.unlinkSync(testFilePath('./no-unused-modules/file-added-3.js'));
    }
  });
});

describe('test behavior for destructured exports', () => {
  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({
        code: `import { destructured } from '${testFilePath('./no-unused-modules/file-destructured-1.js')}'`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-destructured-2.js'),
      }),
      test({
        code: `export const { destructured } = {};`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-destructured-1.js'),
      }),
    ],
    invalid: [
      test({
        code: `export const { destructured2 } = {};`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-destructured-1.js'),
        errors: [`exported declaration 'destructured2' not used within other modules`],
      }),
    ],
  });
});

describe('test behavior for new file', () => {
  before(() => {
    fs.writeFileSync(testFilePath('./no-unused-modules/file-added-4.js.js'), '', { encoding: 'utf8' });
  });
  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({
        code: `import * as added from '${testFilePath('./no-unused-modules/file-added-4.js.js')}'`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-added-1.js'),
      }),
      test({
        code: `export const added = () => {}; export default () => {}`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/file-added-4.js.js'),
      }),
    ],
    invalid: [],
  });
  after(() => {
    if (fs.existsSync(testFilePath('./no-unused-modules/file-added-4.js.js'))) {
      fs.unlinkSync(testFilePath('./no-unused-modules/file-added-4.js.js'));
    }
  });
});

describe('do not report missing export for ignored file', () => {
  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({
        code: 'export const test = true',
        options: [
          {
            src: [testFilePath('./no-unused-modules/**/*.js')],
            ignoreExports: [testFilePath('./no-unused-modules/*ignored*.js')],
            missingExports: true,
          },
        ],
        filename: testFilePath('./no-unused-modules/file-ignored-a.js'),
      }),
    ],
    invalid: [],
  });
});

// lint file not available in `src`
ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({
      code: `export const jsxFoo = 'foo'; export const jsxBar = 'bar'`,
      options: unusedExportsOptions,
      filename: testFilePath('../jsx/named.jsx'),
    }),
  ],
  invalid: [],
});

describe('do not report unused export for files mentioned in package.json', () => {
  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({
        code: 'export const bin = "bin"',
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/bin.js'),
      }),
      test({
        code: 'export const binObject = "binObject"',
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/binObject/index.js'),
      }),
      test({
        code: 'export const browser = "browser"',
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/browser.js'),
      }),
      test({
        code: 'export const browserObject = "browserObject"',
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/browserObject/index.js'),
      }),
      test({
        code: 'export const main = "main"',
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/main/index.js'),
      }),
    ],
    invalid: [
      test({
        code: 'export const privatePkg = "privatePkg"',
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/privatePkg/index.js'),
        errors: [error(`exported declaration 'privatePkg' not used within other modules`)],
      }),
    ],
  });
});

describe('Avoid errors if re-export all from umd compiled library', () => {
  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({
        code: `export * from '${testFilePath('./no-unused-modules/bin.js')}'`,
        options: unusedExportsOptions,
        filename: testFilePath('./no-unused-modules/main/index.js'),
      }),
    ],
    invalid: [],
  });
});

context('TypeScript', function () {
  getTSParsers().forEach((parser) => {
    typescriptRuleTester.run('no-unused-modules', rule, {
      valid: [].concat(
        test({
          code: `
            import {b} from './file-ts-b';
            import {c} from './file-ts-c';
            import {d} from './file-ts-d';
            import {e} from './file-ts-e';

            const a = b + 1 + e.f;
            const a2: c = {};
            const a3: d = {};
          `,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-a.ts'),
        }),
        test({
          code: `export const b = 2;`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-b.ts'),
        }),
        test({
          code: `export interface c {};`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-c.ts'),
        }),
        test({
          code: `export type d = {};`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-d.ts'),
        }),
        test({
          code: `export enum e { f };`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-e.ts'),
        }),
        test({
          code: `
            import type {b} from './file-ts-b-used-as-type';
            import type {c} from './file-ts-c-used-as-type';
            import type {d} from './file-ts-d-used-as-type';
            import type {e} from './file-ts-e-used-as-type';

            const a: typeof b = 2;
            const a2: c = {};
            const a3: d = {};
            const a4: typeof e = undefined;
          `,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-a-import-type.ts'),
        }),
        test({
          code: `export const b = 2;`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-b-used-as-type.ts'),
        }),
        test({
          code: `export interface c {};`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-c-used-as-type.ts'),
        }),
        test({
          code: `export type d = {};`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-d-used-as-type.ts'),
        }),
        test({
          code: `export enum e { f };`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-e-used-as-type.ts'),
        }),
        // Should also be valid when the exporting files are linted before the importing ones
        isESLint4TODO ? [] : test({
          code: `export interface g {}`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-g.ts'),
        }),
        test({
          code: `import {g} from './file-ts-g';`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-f.ts'),
        }),
        isESLint4TODO ? [] : test({
          code: `export interface g {}; /* used-as-type */`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-g-used-as-type.ts'),
        }),
        test({
          code: `import type {g} from './file-ts-g';`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-f-import-type.ts'),
        }),
      ),
      invalid: [].concat(
        test({
          code: `export const b = 2;`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-b-unused.ts'),
          errors: [
            error(`exported declaration 'b' not used within other modules`),
          ],
        }),
        test({
          code: `export interface c {};`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-c-unused.ts'),
          errors: [
            error(`exported declaration 'c' not used within other modules`),
          ],
        }),
        test({
          code: `export type d = {};`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-d-unused.ts'),
          errors: [
            error(`exported declaration 'd' not used within other modules`),
          ],
        }),
        test({
          code: `export enum e { f };`,
          options: unusedExportsTypescriptOptions,
          parser,
          filename: testFilePath('./no-unused-modules/typescript/file-ts-e-unused.ts'),
          errors: [
            error(`exported declaration 'e' not used within other modules`),
          ],
        }),
      ),
    });
  });
});

describe('correctly work with JSX only files', () => {
  jsxRuleTester.run('no-unused-modules', rule, {
    valid: [
      test({
        code: 'import a from "file-jsx-a";',
        options: unusedExportsJsxOptions,
        parser: p.BABEL_OLD,
        filename: testFilePath('./no-unused-modules/jsx/file-jsx-a.jsx'),
      }),
    ],
    invalid: [
      test({
        code: `export const b = 2;`,
        options: unusedExportsJsxOptions,
        parser: p.BABEL_OLD,
        filename: testFilePath('./no-unused-modules/jsx/file-jsx-b.jsx'),
        errors: [
          error(`exported declaration 'b' not used within other modules`),
        ],
      }),
    ],
  });
});

describe('ignore flow types', () => {
  ruleTester.run('no-unused-modules', rule, {
    valid: parsers.all([
      test({
        code: 'import { type FooType, type FooInterface } from "./flow-2";',
        options: unusedExportsOptions,
        features: ['flow'],
        filename: testFilePath('./no-unused-modules/flow/flow-0.js'),
      }),
      test({
        code: `
          // @flow strict
          export type FooType = string;
          export interface FooInterface {};
        `,
        options: unusedExportsOptions,
        features: ['flow'],
        filename: testFilePath('./no-unused-modules/flow/flow-2.js'),
      }),
      test({
        code: 'import type { FooType, FooInterface } from "./flow-4";',
        options: unusedExportsOptions,
        features: ['flow'],
        filename: testFilePath('./no-unused-modules/flow/flow-3.js'),
      }),
      test({
        code: `
          // @flow strict
          export type FooType = string;
          export interface FooInterface {};
        `,
        options: unusedExportsOptions,
        features: ['flow'],
        filename: testFilePath('./no-unused-modules/flow/flow-4.js'),
      }),
      test({
        code: `
          // @flow strict
          export type Bar = number;
          export interface BarInterface {};
        `,
        options: unusedExportsOptions,
        features: ['flow'],
        filename: testFilePath('./no-unused-modules/flow/flow-1.js'),
      }),
    ]),
    invalid: [],
  });
});

describe('support (nested) destructuring assignment', () => {
  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({
        code: 'import {a, b} from "./destructuring-b";',
        options: unusedExportsOptions,
        parser: p.BABEL_OLD,
        filename: testFilePath('./no-unused-modules/destructuring-a.js'),
      }),
      test({
        code: 'const obj = {a: 1, dummy: {b: 2}}; export const {a, dummy: {b}} = obj;',
        options: unusedExportsOptions,
        parser: p.BABEL_OLD,
        filename: testFilePath('./no-unused-modules/destructuring-b.js'),
      }),
    ],
    invalid: [],
  });
});
