<!--
SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>

SPDX-License-Identifier: CC0-1.0
-->

# Contributing

Contributions are very welcome. The following will provide some helpful guidelines.

## How to contribute

### Commits

Each commit should be atomic and pass all tests. Logically unrelated changes should not be gathered in one commit.

Commit messages should be clear and fully elaborate the context and the reason for a change. The first line should
contain a brief imperative summary starting with a capitalized character and be followed by a more detailed
explanatory text separated by an empty line. If your commit refers to an issue, please post-fix it with the
issue number.

Example:

```
Short summary of changes (72 characters or less)

More detailed explanatory text, if necessary. This text can have
several lines.

Issue: #123  (optional; if there is a related issue)
Fix: #123  (optional; if the commit resolves the issue)
```

Furthermore, commits should be signed off according to the [DCO](DCO.md).

### Pull requests

Pull requests should have a clear description that fully elaborates the context and the reason for a change.
The corresponding template should be used. If your pull request resolves an issue, please add a respective
line to the end.

## Developer's guide

OpossumUI is an Electron app written in TypeScript. The frontend uses React (where functional components are used
whenever possible) with Redux for state management.

### OS

Development under Linux and macOS is fully supported: Development under Windows has currently the following limitations:

- only Windows executables can be built.

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
yarn test:local
```

to run a subset of all tests. To run all tests:

```
yarn test:unit
yarn test:integration-ci
```

End to end test are available and can be run using:

```
yarn test:e2e
```

Prettier is used as a code formatter.

### Requirements

The following software is required for working on the repository:

- [git](https://git-scm.com/),
- [node.js](https://nodejs.org/) 18,
- [yarn](https://yarnpkg.com/en/),
- [reuse/tool](https://git.fsfe.org/reuse/tool#install) (to check that copyright information is provided, for more context see https://reuse.software/),
- [wine](https://www.winehq.org/) (only to build the Windows version).

### Building the app

To build for a single OS run either `yarn ship-linux`, `yarn ship-mac` or `yarn ship-win`. To build for all three
systems run `yarn ship`.
**Important:** wine must be installed to build a Windows installer on a non-Windows system.

The built release(s) can be found under _/release_

## Creating a new release

Note: You will need Maintain permissions in order to create a new release.

### Checklist

1. **Test** on a large real-world example.
   1. Create a build for your OS using either `yarn ship-linux`, `yarn ship-mac` or `yarn ship-win`.
   1. Check performances on a large .opossum file.
   1. Check that the layout does not break at lower resolutions (you can use View → Zoom in OpussumUI and resize the window, don't need to change resolution).
   1. Check that the performance of the save operation is good.
   1. Check that the notices for the app itself and chromium are accessible via the menu.
1. **Create** the release via UI (see next section for details).
1. Optional: Notify users about a new release.
   1. Wait until all the artifacts are shown on Github before sending a message.
   1. Briefly mention the most important changes.

### Creating a release

1. Go to: https://github.com/opossum-tool/OpossumUI/releases/new
1. Use the UI to create an new release. The tag should have the format "OpossumUI-2023-$MONTH-$DAY" (in case of a second release on the same day "OpossumUI-2023-$MONTH-$DAY.1").
1. The title of the release equals the tag.
1. Click the button "Generate release notes" to get the description for the release. Then, remove all the changes from dependabot (lines that include "Bump").

![release](./docs/release_guide.png)
