import { test, SYNTAX_CASES, testVersion, testFilePath } from '../utils';
import parsers from '../parsers';

import { RuleTester } from 'eslint';
import flatMap from 'array.prototype.flatmap';
import semver from 'semver';
import { version as tsOldVersion } from 'typescript-eslint-parser/package.json';

const ruleTester = new RuleTester({
  env: { es6: true },
  parserOptions: { ecmaVersion: 6, sourceType: 'module' },
});
const rule = require('rules/namespace');


function error(name, namespace) {
  return { message: `'${name}' not found in imported namespace '${namespace}'.` };
}

const jsxOptions = {
  parserOptions: {
    ecmaFeatures: { jsx: true },
  },
};

ruleTester.run('namespace', rule, {
  valid: parsers.all([].concat(
    test({ code: 'import "./malformed.js"' }),

    test({ code: "import * as foo from './empty-folder';" }),
    test({
      code: 'import * as names from "./named-exports"; console.log((names.b).c);',
    }),

    test({ code: 'import * as names from "./named-exports"; console.log(names.a);' }),
    test({ code: 'import * as names from "./re-export-names"; console.log(names.foo);' }),
    test({
      code: "import * as elements from './jsx';",
      ...jsxOptions,
    }),
    test({ code: "import * as foo from './common';" }),

    // destructuring namespaces
    test({ code: 'import * as names from "./named-exports"; const { a } = names' }),
    test({ code: 'import * as names from "./named-exports"; const { d: c } = names' }),
    test({
      code: `import * as names from "./named-exports"; const { c } = foo
      , { length } = "names"
      , alt = names`,
    }),
    // deep destructuring only cares about top level
    test({
      code: 'import * as names from "./named-exports"; const { ExportedClass: { length } } = names',
    }),

    // detect scope redefinition
    test({
      code: 'import * as names from "./named-exports"; function b(names) { const { c } = names }',
    }),
    test({
      code: 'import * as names from "./named-exports"; function b() { let names = null; const { c } = names }',
    }),
    test({
      code: 'import * as names from "./named-exports"; const x = function names() { const { c } = names }',
    }),


    /////////
    // es7 //
    /////////
    test({
      code: 'export * as names from "./named-exports"',
      features: ['export-star'],
    }),
    test({
      code: 'export defport, * as names from "./named-exports"',
      features: ['ts', 'no-ts-new', 'export-star'],
    }),
    // non-existent is handled by no-unresolved
    test({
      code: 'export * as names from "./does-not-exist"',
      features: ['export-star'],
    }),

    test({
      code: 'import * as Endpoints from "./issue-195/Endpoints"; console.log(Endpoints.Users)',
      features: ['ts', 'no-ts-new'].concat(semver.satisfies(tsOldVersion, '< 22') ? 'no-ts-old' : []),
    }),

    // respect hoisting
    test({
      code: 'function x() { console.log((names.b).c); } import * as names from "./named-exports";',
    }),

    // names.default is valid export
    test({ code: "import * as names from './default-export';" }),
    test({ code: "import * as names from './default-export'; console.log(names.default)" }),
    test({
      code: 'export * as names from "./default-export"',
      features: ['export-star'],
    }),
    test({
      code: 'export defport, * as names from "./default-export"',
      features: ['no-ts-new', 'export-star'],
    }),

    // #456: optionally ignore computed references
    test({
      code: `import * as names from './named-exports'; console.log(names['a']);`,
      features: ['no-ts'], // TODO: FIXME: remove `no-ts`
      options: [{ allowComputed: true }],
    }),

    // #656: should handle object-rest properties
    test({
      code: `import * as names from './named-exports'; const {a, b, ...rest} = names;`,
      features: ['object spread', 'no-ts'], // TODO: FIXME: remove `no-ts`
    }),

    // #1144: should handle re-export CommonJS as namespace
    test({
      code: `import * as ns from './re-export-common'; const {foo} = ns;`,
    }),

    // JSX
    test({
      code: 'import * as Names from "./named-exports"; const Foo = <Names.a/>',
      ...jsxOptions,
    }),

    // Typescript
    test({
      code: `
        import * as foo from "./typescript-declare-nested"
        foo.bar.MyFunction()
      `,
      features: ['ts'],
    }),

    test({
      code: `import { foobar } from "./typescript-declare-interface"`,
      features: ['ts'],
    }),

    test({
      code: 'export * from "typescript/lib/typescript.d"',
      features: ['ts', 'export-star'],
    }),

    test({
      code: 'export = function name() {}',
      features: ['ts', 'no-babel-old'],
    }),

    SYNTAX_CASES,

    test({
      code: `
        import * as color from './color';
        export const getBackgroundFromColor = (color) => color.bg;
        export const getExampleColor = () => color.example
      `,
    }),

    testVersion('>= 6', () => ({
      code: `
        import * as middle from './middle';

        console.log(middle.myName);
      `,
      features: [].concat(
        'export-star',
        semver.satisfies(tsOldVersion, '< 22') ? 'no-ts-old' : [],
      ),
      filename: testFilePath('export-star-2/downstream.js'),
    })),
    // es2022: Arbitrary module namespace identifier names
    test({
      code: "import * as names from './default-export-string';",
      features: ['arbitrary imports'],
    }),
    test({
      code: "import * as names from './default-export-string'; console.log(names.default)",
      features: ['arbitrary imports'],
    }),
    test({
      code: "import * as names from './default-export-namespace-string';",
      features: ['arbitrary imports'],
    }),
    test({
      code: "import * as names from './default-export-namespace-string'; console.log(names.default)",
      features: ['arbitrary imports'],
    }),
    test({
      code: `import { "b" as b } from "./deep/a"; console.log(b.c.d.e)`,
      features: ['arbitrary imports'],
    }),
    test({
      code: `import { "b" as b } from "./deep/a"; var {c:{d:{e}}} = b`,
      features: ['arbitrary imports'],
    }),

    flatMap(['deep', 'deep-es7'], (folder) => [
      test({
        code: `import * as a from "./${folder}/a"; console.log(a.b.c.d.e)`,
        features: [].concat(
          folder === 'deep-es7' ? 'no-default' : [],
          semver.satisfies(tsOldVersion, '< 22') ? 'no-ts-old' : [],
        ),
      }),
      test({
        code: `import { b } from "./${folder}/a"; console.log(b.c.d.e)`,
        features: [].concat(
          folder === 'deep-es7' ? 'no-default' : [],
          semver.satisfies(tsOldVersion, '< 22') ? 'no-ts-old' : [],
        ),
      }),
      test({
        code: `import * as a from "./${folder}/a"; console.log(a.b.c.d.e.f)`,
        features: [].concat(
          folder === 'deep-es7' ? 'no-default' : [],
          semver.satisfies(tsOldVersion, '< 22') ? 'no-ts-old' : [],
        ),
      }),
      test({
        code: `import * as a from "./${folder}/a"; var {b:{c:{d:{e}}}} = a`,
        features: [].concat(
          folder === 'deep-es7' ? 'no-default' : [],
          semver.satisfies(tsOldVersion, '< 22') ? 'no-ts-old' : [],
        ),
      }),
      test({
        code: `import { b } from "./${folder}/a"; var {c:{d:{e}}} = b`,
        features: [].concat(
          folder === 'deep-es7' ? 'no-default' : [],
          semver.satisfies(tsOldVersion, '< 22') ? 'no-ts-old' : [],
        ),
      }),
      // deep namespaces should include explicitly exported defaults
      test({
        code: `import * as a from "./${folder}/a"; console.log(a.b.default)`,
        features: [].concat(
          folder === 'deep-es7' ? 'no-default' : [],
          semver.satisfies(tsOldVersion, '< 22') ? 'no-ts-old' : [],
        ),
      }),
    ]),
  )),

  invalid: parsers.all([].concat(
    test({
      code: `import * as names from './named-exports'; console.log(names.c);`,
      features: ['no-ts'], // TODO: FIXME: remove `no-ts`
      errors: [error('c', 'names')],
    }),

    test({
      code: "import * as names from './named-exports'; console.log(names['a']);",
      features: ['no-ts'], // TODO: FIXME: remove `no-ts`
      errors: ["Unable to validate computed reference to imported namespace 'names'."],
    }),

    // assignment warning (from no-reassign)
    test({
      code: `import * as foo from './bar'; foo.foo = 'y';`,
      features: ['no-ts'], // TODO: FIXME: remove `no-ts`
      errors: [{ message: 'Assignment to member of namespace \'foo\'.' }],
    }),

    test({
      code: `import * as foo from './bar'; foo.x = 'y';`,
      features: ['no-ts'], // TODO: FIXME: remove `no-ts`
      errors: ['Assignment to member of namespace \'foo\'.', "'x' not found in imported namespace 'foo'."],
    }),

    // invalid destructuring
    test({
      code: 'import * as names from "./named-exports"; const { c } = names',
      features: ['no-ts'], // TODO: FIXME: remove `no-ts`
      errors: [{ type: 'Property', message: "'c' not found in imported namespace 'names'." }],
    }),
    test({
      code: 'import * as names from "./named-exports"; function b() { const { c } = names }',
      features: ['no-ts'], // TODO: FIXME: remove `no-ts`
      errors: [{ type: 'Property', message: "'c' not found in imported namespace 'names'." }],
    }),
    test({
      code: 'import * as names from "./named-exports"; const { c: d } = names',
      features: ['no-ts'], // TODO: FIXME: remove `no-ts`
      errors: [{ type: 'Property', message: "'c' not found in imported namespace 'names'." }],
    }),
    test({
      code: 'import * as names from "./named-exports"; const { c: { d } } = names',
      features: ['no-ts'], // TODO: FIXME: remove `no-ts`
      errors: [{ type: 'Property', message: "'c' not found in imported namespace 'names'." }],
    }),

    /////////
    // es7 //
    /////////

    test({
      code: 'import * as Endpoints from "./issue-195/Endpoints"; console.log(Endpoints.Foo)',
      features: ['ts', 'no-ts-new'].concat(semver.satisfies(tsOldVersion, '< 22') ? 'no-ts-old' : []),
      errors: ["'Foo' not found in imported namespace 'Endpoints'."],
    }),

    // parse errors
    test({
      code: "import * as namespace from './malformed.js';",
      features: ['no-ts-new', 'no-babel-old'].concat(semver.satisfies(tsOldVersion, '< 22') ? 'no-ts-old' : []),
      errors: [
        {
          message: "Parse errors in imported module './malformed.js': 'return' outside of function (1:1)",
          type: 'Literal',
        },
      ],
    }),
    test({
      code: "import * as namespace from './malformed.js';",
      features: ['no-default', 'no-babel', 'no-ts-new'].concat(semver.satisfies(tsOldVersion, '< 22') ? [] : 'no-ts-old'),
      errors: [
        {
          message: "Parse errors in imported module './malformed.js': ';' expected. (1:11)",
          type: 'Literal',
        },
      ],
    }),

    test({
      code: "import b from './deep/default'; console.log(b.e)",
      errors: [ "'e' not found in imported namespace 'b'." ],
    }),

    // respect hoisting
    test({
      code: `console.log(names.c); import * as names from './named-exports'; `,
      errors: [error('c', 'names')],
    }),
    test({
      code: `function x() { console.log(names.c) } import * as names from './named-exports';`,
      errors: [error('c', 'names')],
    }),

    // #328: * exports do not include default
    test({
      code: 'import * as ree from "./re-export"; console.log(ree.default)',
      errors: [`'default' not found in imported namespace 'ree'.`],
    }),

    // JSX
    test({
      code: 'import * as Names from "./named-exports"; const Foo = <Names.e/>',
      ...jsxOptions,
      errors: [error('e', 'Names')],
    }),

    // es2022: Arbitrary module namespace identifier names
    test({
      code: `import { "b" as b } from "./deep/a"; console.log(b.e)`,
      errors: [ "'e' not found in imported namespace 'b'." ],
      features: ['arbitrary imports'],
    }),

    test({
      code: `import { "b" as b } from "./deep/a"; console.log(b.c.e)`,
      errors: [ "'e' not found in deeply imported namespace 'b.c'." ],
      features: ['arbitrary imports'],
    }),

    flatMap(['deep', 'deep-es7'], (folder) => [
      test({
        code: `import * as a from "./${folder}/a"; console.log(a.b.e)`,
        features: ['export-star'].concat(
          folder === 'deep-es7' ? ['no-default', 'no-ts-new'] : [],
          semver.satisfies(tsOldVersion, '< 22') ? [] : 'no-ts-old',
        ),
        errors: [ "'e' not found in deeply imported namespace 'a.b'." ],
      }),
      test({
        code: `import { b } from "./${folder}/a"; console.log(b.e)`,
        features: ['export-star'].concat(
          folder === 'deep-es7' ? ['no-default', 'no-ts-new'] : [],
          semver.satisfies(tsOldVersion, '< 22') ? [] : 'no-ts-old',
        ),
        errors: [ "'e' not found in imported namespace 'b'." ],
      }),
      test({
        code: `import * as a from "./${folder}/a"; console.log(a.b.c.e)`,
        features: ['export-star'].concat(folder === 'deep-es7' ? ['no-default', 'no-ts-new'] : []),
        errors: [ "'e' not found in deeply imported namespace 'a.b.c'." ],
      }),
      test({
        code: `import { b } from "./${folder}/a"; console.log(b.c.e)`,
        features: ['export-star'].concat(folder === 'deep-es7' ? ['no-default', 'no-ts-new'] : []),
        errors: [ "'e' not found in deeply imported namespace 'b.c'." ],
      }),
      test({
        code: `import * as a from "./${folder}/a"; var {b:{ e }} = a`,
        features: ['export-star'].concat(folder === 'deep-es7' ? ['no-default', 'no-ts-new'] : []),
        errors: [ "'e' not found in deeply imported namespace 'a.b'." ],
      }),
      test({
        code: `import * as a from "./${folder}/a"; var {b:{c:{ e }}} = a`,
        features: ['export-star'].concat(folder === 'deep-es7' ? ['no-default', 'no-ts-new'] : []),
        errors: [ "'e' not found in deeply imported namespace 'a.b.c'." ],
      }),
    ]),
  )),
});
