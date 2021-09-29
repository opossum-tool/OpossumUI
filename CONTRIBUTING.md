<!--
SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>

SPDX-License-Identifier: CC0-1.0
-->

# Contributing

Contributions are very welcome. The following will provide some helpful guidelines.

## How to contribute

### Commits

Commit messages should be clear and fully elaborate the context and the reason of a change. If your commit refers to an
issue, please post-fix it with the issue number, e.g.

```
Issue: #123
```

Furthermore, commits should be signed off according to the [DCO](DCO.md).

### Pull Requests

If your Pull Request resolves an issue, please add a respective line to the end, like

```
Resolves #123
```

## Developer's guide

OpossumUI is an Electron app written in TypeScript. The frontend uses React (where functional components are used
whenever possible) with Redux for state management.

### OS

Development under Linux and macOS is fully supported: Development under Windows has currently the following limitations:

- only Windows executables can be built,
- "version unknown" is written in the built app instead of the commit hash

### Repo setup

Clone the OpossumUI repo. E.g. run the following command in a terminal:

```bash
git clone git@github.com:opossum-tool/OpossumUI.git
```

To install dependencies and set up the working environment, go to the repository root directory and run:

```bash
yarn install
```

All useful scripts are listed in the package.json and can be run through `yarn` and can be called after cloning the
repository and installing all dependencies. To start the app based on the current state of the code, including automatic
updates after changes to the frontend, execute:

```
yarn start
```

Unit tests are provided for all features, aided by integration tests when helpful. The testing framework is jest + react
testing library. They can be run locally by executing:

```
yarn test
```

Prettier is used as a code formatter.

### Requirements

The following software is required for working on the repository:

- [git](https://git-scm.com/),
- [node.js](https://nodejs.org/) 14+,
- [yarn](https://yarnpkg.com/en/),
- [reuse.software](https://reuse.software/) (to check that copyright information is provided),
- [wine](https://www.winehq.org/) (only to build the Windows version).

### Building the app

To build for a single OS run either `yarn ship-linux`, `yarn ship-mac` or `yarn ship-win`. To build for all three
systems run `yarn ship`.
**Important:** wine must be installed to build a Windows installer on a non-Windows system.

The built release(s) can be found under _/release/linux_and_windows_ or _/release/macOS_

### <a id="file_formats"></a> File formats

JSON schemas for both the [input](src/ElectronBackend/input/OpossumInputFileSchema.json)
and [output](src/ElectronBackend/input/OpossumOutputFileSchema.json) files are available. Example files can be found
under [example files](example-files/).

#### Input file

It has to be generated through external tools and provided to the app. Contains 5 main fields:

- `metadata`: contains some project-level information,
- `resources`: defines the file tree,
- `externalAttributions`: contains all attributions which are provided as signals (preselected signals will be
  automatically used by the app to create attributions in the output file),
- `resourcesToAttributions`: links attributions to file paths,
- `frequentlicenses`: A list of licenses that can be selected in a dropdown when the user enters a license name.

There are additional fields which are optional:

- `attributionBreakpoints`: a list of folder paths where attribution inference stops, e.g. `node_modules`."
- `filesWithChildren`: a list of folders that are treated as files. This can be used to attach another file tree to
  files like `package.json`, usually also setting an attribution breakpoint.
- `baseUrlsForSources`: a map from paths to the respective base url. The base url should contain a {path} placeholder.
  E.g.

```
  "baseUrlsForSources": {
    "/": "https://github.com/opossum-tool/opossumUI/blob/main/{path}"
  }
```
- `externalAttributionSources`: used to store a mapping of short names for attribution sources to full names and priorities used for sorting in the PackagePanel. Entries with smaller numbers have a higher priority. E.g.:

```
  "externalAttributionSources": {
    SC: {
      name: "ScanCode", 
      priority: 1
    }
  }
```


#### Output file

Contains 4 main fields:

- `metadata`: contains some project-level information,
- `manualAttributions`: contains all attributions created by the user or preselected,
- `resourcesToAttributions`: links attributions to file paths,
- `resolvedExternalAttributions`: used to store which signal attributions have been resolved, as they are hidden in the
  UI.
