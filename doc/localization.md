# Localization

## Adding Strings

- Modify the english translation file `i18n/en/index.ts` and re-run generator to updates static 
  type definitions.
- `package.json` should contain scripts to work with generator
    - `typesafe-i18n` watches source good for local dev
    - `typesafe-i18n-ci` does not watch changes, so can be used to build function

## Technical

- Powered by [typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n)
