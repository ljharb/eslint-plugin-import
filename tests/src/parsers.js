'use strict';

const path = require('path');
const semver = require('semver');
const version = require('eslint/package.json').version;
const flatMap = require('array.prototype.flatmap');
const tsVersion = require('typescript/package.json').version;
const tsOldVersion = require('typescript-eslint-parser/package.json').version;
const tsParserVersion = require('@typescript-eslint/parser/package.json').version;

const disableNewTS = semver.satisfies(tsParserVersion, '>= 4.1') // this rule is not useful on v4.1+ of the TS parser
  ? (x) => Object.assign({}, x, { features: [].concat(x.features, 'no-ts-new') })
  : (x) => x;

const NODE_MODULES = '../../node_modules';

const parsers = {
  BABEL_ESLINT: path.join(__dirname, NODE_MODULES, 'babel-eslint'),
  '@BABEL_ESLINT': path.join(__dirname, NODE_MODULES, '@babel/eslint-parser'),
  TYPESCRIPT_ESLINT: path.join(__dirname, NODE_MODULES, 'typescript-eslint-parser'),
  '@TYPESCRIPT_ESLINT': path.join(__dirname, NODE_MODULES, '@typescript-eslint/parser'),
  disableNewTS,
  babelParserOptions: function parserOptions(test, features) {
    return {
      ...test.parserOptions,
      requireConfigFile: false,
      babelOptions: {
        presets: [
          '@babel/preset-react',
        ],
        plugins: [
          '@babel/plugin-syntax-do-expressions',
          '@babel/plugin-syntax-function-bind',
          ['@babel/plugin-syntax-decorators', { legacy: true }],
          '@babel/plugin-syntax-export-default-from',
        ],
        parserOpts: {
          allowSuperOutsideMethod: false,
          allowReturnOutsideFunction: false,
        },
      },
      ecmaFeatures: {
        ...(!!test.parserOptions && test.parserOptions.ecmaFeatures),
        jsx: true,
        modules: true,
        legacyDecorators: features.has('decorators'),
      },
    };
  },
  all: function all(tests) {
    const t = flatMap(tests, (test) => {
      if (typeof test === 'string') {
        test = { code: test };
      }
      if ('parser' in test) {
        delete test.features;
        return test;
      }
      const features = new Set([].concat(test.features || []));
      delete test.features;
      const es = test.parserOptions && test.parserOptions.ecmaVersion;

      function addComment(testObject, parser) {
        const extras = [].concat(
          `features: [${Array.from(features).join(',')}]`,
          `parser: ${parser}`,
          testObject.parserOptions ? `parserOptions: ${JSON.stringify(testObject.parserOptions)}` : [],
          testObject.options ? `options: ${JSON.stringify(testObject.options)}` : [],
        );

        const extraComment = `\n// ${extras.join(', ')}`;

        // Augment expected fix code output with extraComment
        const nextCode = { code: testObject.code + extraComment };
        const nextOutput = testObject.output && { output: testObject.output + extraComment };

        // Augment expected suggestion outputs with extraComment
        // `errors` may be a number (expected number of errors) or an array of
        // error objects.
        const nextErrors = testObject.errors
          && typeof testObject.errors !== 'number'
          && {
            errors: testObject.errors.map(
              (errorObject) => {
                if (typeof errorObject === 'string') {
                  return { message: errorObject };
                }
                const nextSuggestions = errorObject.suggestions && {
                  suggestions: errorObject.suggestions.map((suggestion) => Object.assign({}, suggestion, {
                    output: suggestion.output + extraComment,
                  })),
                };

                return Object.assign({}, errorObject, nextSuggestions);
              },
            ),
          };

        return Object.assign(
          {},
          testObject,
          nextCode,
          nextOutput,
          nextErrors,
        );
      }

      const skipBase = (features.has('class fields') && semver.satisfies(version, '< 8'))
        || (es >= 2020 && semver.satisfies(version, '< 6'))
        || (features.has('arbitrary imports') && semver.satisfies(version, '< 8.7'))
        || features.has('no-default')
        || features.has('bind operator')
        || features.has('do expressions')
        || features.has('decorators')
        || features.has('flow')
        || features.has('ts')
        || features.has('types')
        || features.has('export-star') // TODO: see about removing this
        || (features.has('fragment') && semver.satisfies(version, '< 5'));

      const skipBabel = features.has('no-babel');
      const skipOldBabel = skipBabel
        || features.has('no-babel-old')
        || features.has('arbitrary imports')
        || semver.satisfies(version, '>= 8');
      const skipNewBabel = skipBabel
        || features.has('no-babel-new')
        || !semver.satisfies(version, '^7.5.0') // require('@babel/eslint-parser/package.json').peerDependencies.eslint
        || features.has('flow')
        || features.has('types')
        || features.has('ts');
      const skipTS = semver.satisfies(version, '< 5')
        || features.has('no-ts')
        || features.has('flow')
        || features.has('jsx namespace')
        || features.has('bind operator')
        || (features.has('arbitrary imports') && semver.satisfies(tsVersion, '< 4.1'))
        || features.has('do expressions');
      const tsOld = !skipTS
        && !features.has('no-ts-old')
        && (semver.satisfies(tsOldVersion, '< 21') || semver.satisfies(version, '< 7'))
        && (!features.has('export-star') || semver.satisfies(tsOldVersion, '>= 22'));
      const tsNew = !skipTS && !features.has('no-ts-new');

      const minEcmaVersion = (features.has('class fields') || features.has('arbitrary imports'))
        ? 2022
        : (features.has('dynamic import') || features.has('export-star'))
          ? 2020
          : -Infinity;
      const ecmaVersion = Math.max((test.parserOptions && test.parserOptions.ecmaVersion) || 0, minEcmaVersion) || undefined;

      return [].concat(
        skipBase ? [] : addComment({
          ...test,
          ...(ecmaVersion && {
            parserOptions: {
              ...test.parserOptions,
              ecmaVersion,
            },
          }),
        }, 'default'),
        skipOldBabel ? [] : addComment({
          ...test,
          parser: parsers.BABEL_ESLINT,
          parserOptions: parsers.babelParserOptions(test, features),
        }, 'babel-eslint'),
        skipNewBabel ? [] : addComment({
          ...test,
          parser: parsers['@BABEL_ESLINT'],
          parserOptions: parsers.babelParserOptions(test, features),
        }, '@babel/eslint-parser'),
        tsOld ? addComment({
          ...test,
          parser: parsers.TYPESCRIPT_ESLINT,
          settings: {
            'import/parsers': { [parsers.TYPESCRIPT_ESLINT]: ['.ts'] },
            'import/resolver': { 'eslint-import-resolver-typescript': true },
            ...test.settings,
          },
        }, 'typescript-eslint') : [],
        tsNew ? addComment({
          ...test,
          parser: parsers['@TYPESCRIPT_ESLINT'],
          settings: {
            'import/parsers': { [parsers['@TYPESCRIPT_ESLINT']]: ['.ts'] },
            'import/resolver': { 'eslint-import-resolver-typescript': true },
            ...test.settings,
          },
        }, '@typescript/eslint') : [],
      );
    });
    return t;
  },
};

module.exports = parsers;
