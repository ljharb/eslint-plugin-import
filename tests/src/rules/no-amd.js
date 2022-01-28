import { RuleTester } from 'eslint';
import eslintPkg from 'eslint/package.json';
import semver from 'semver';

import parsers from '../parsers';

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2015, sourceType: 'module' } });

ruleTester.run('no-amd', require('rules/no-amd'), {
  valid: parsers.all([].concat(
    { code: 'import "x";' },
    { code: 'import x from "x"' },
    'var x = require("x")',

    'require("x")',
    // 2-args, not an array
    'require("x", "y")',
    // random other function
    'setTimeout(foo, 100)',
    // non-identifier callee
    '(a || b)(1, 2, 3)',

    // nested scope is fine
    'function x() { define(["a"], function (a) {}) }',
    'function x() { require(["a"], function (a) {}) }',

    // unmatched arg types/number
    'define(0, 1, 2)',
    'define("a")',
  )),

  invalid: parsers.all([].concat(
    semver.satisfies(eslintPkg.version, '>= 4') ? [
      {
        code: 'define([], function() {})',
        errors: [{ message: 'Expected imports instead of AMD define().' }],
      },
      {
        code: 'define(["a"], function(a) { console.log(a); })',
        errors: [{ message: 'Expected imports instead of AMD define().' }],
      },
      {
        code: 'require([], function() {})',
        errors: [{ message: 'Expected imports instead of AMD require().' }],
      },
      {
        code: 'require(["a"], function(a) { console.log(a); })',
        errors: [{ message: 'Expected imports instead of AMD require().' }],
      },
    ] : [],
  )),
});
