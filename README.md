# cyclone

This package was inspired by logic added in certain LifeOmic repos
to check for cyclic dependencies and to enforce specific forbidden cyclic
imports. The logic used [madge](https://www.npmjs.com/package/madge)
to implement the functionality.

This package exists to avoid duplicating the exact same setup and
code in every repo that wants to check for cyclic dependencies.

## Usage

Install the package:

```
yarn add -D @lifeomic/cyclone
```

Add a `cyclone.config.json` file to the root of the project with the following
structure:

```json
{
  "targetDir": "./src",
  "disallowedDependencies": [
    {
      "from": {
        "value": "schema/",
        "negate": true,
        "caseInsensitive": true
      },
      "to": {
        "value": "generated/schema"
      }
    }
  ],
  "fileExtensions": [
    "ts",
    "js"
  ]
}
```

Run `yarn cyclone`. You probably want to add this to your lint step.

Blow away those cycles 🌪️

## Config Properties

- `targetDir`: the specific directory where the cycle checks/enforcements
  should happen.
- `disallowedDependencies`: an array of objects that define the explicit
  disallowed dependencies.
    - `from`: Object specifying the source of the forbidden dependency.
      - `value`: a regular expression that should match the directory or file
        that should not be allowed to import the `to` value.
      - `negate`: if true, the `value` regular expression will be negated.
      - `caseInsensitive`: if true, the `value` regular expression will be
        case insensitive.
    - `to`: Object specifying the destination of the forbidden dependency.
      - `value`: a regular expression that should match the directory or file
        that should not be allowed to be imported by the `from` value.
      - `negate`: if true, the `value` regular expression will be negated.
      - `caseInsensitive`: if true, the `value` regular expression will be
        case insensitive.
- `fileExtensions`: optional - defaults to `["ts", "js"]`. These are valid file
  extensions used to find files in directories. Passed directly to madge.


