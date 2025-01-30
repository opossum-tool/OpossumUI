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

We use [conventional commits](https://www.conventionalcommits.org/) of the following form:

```txt
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

where `<type>` is one of

```txt
[
  'build',
  'chore',
  'ci',
  'docs',
  'feat',
  'fix',
  'perf',
  'refactor',
  'revert',
  'style',
  'test'
]
```

Example:

```txt
fix: minor typos in code

see the issue for details on the typos fixed

fixes issue #12
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

```bash
yarn start
```

Unit tests are provided for all features. The testing framework is jest + react testing library. They can be run by executing:

```bash
yarn test:unit
```

End to end test are available and can be run using:

```bash
yarn test:e2e
```

Prettier is used as a code formatter.

### Requirements

The following software is required for working on the repository:

- [git](https://git-scm.com/),
- [node.js](https://nodejs.org/) 22,
- [yarn](https://yarnpkg.com/en/),
- [reuse/tool](https://git.fsfe.org/reuse/tool#install) (to check that copyright information is provided, for more context see [here](https://reuse.software/)),
- [wine](https://www.winehq.org/) (only to build the Windows version).

### Running the end-to-end tests

As mentioned above, the end-to-end tests can be run using `yarn test:e2e`. This runs the tests against the dev server. To run the tests against a built version of the app, which is also what the CI/CD pipeline does, run `yarn test:e2e:ci`. See below for how to build the app for your OS.

If you use VSCode, we recommend you install the [Playwright Test for VSCode extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright). This will allow you running individual tests from within VSCode, either by clicking the green play button next to a test, or by going to the "testing" tab in the sidebar.

Note that the extension can only run the tests against a built version of the app, so you must have a valid release for your OS in your local `release` folder. In addition, you have to add the following environment variable to your `settings.json`:

```json
"playwright.env": {
   "RELEASE": true
}
```

If you use IntelliJ Ultimate, you can install the [Test Automation Plugin](https://plugins.jetbrains.com/plugin/20175-test-automation). This provides green play buttons next to the tests, and the possibility to run tests via the "Run" menu or tab. As for VSCode, please note, that you need to run the test against a built version of the app. Your test configuration should look similar to the one below.

![intellij playwright](./docs/intellij_playwright_plugin_test_config.png)

Please note, that there seem to be some issues with this plugin. It can help to invalidate caches ("File" -> "Invalidate Caches...") and restart IntelliJ.

### Debugging the end-to-end tests

Each executed end-to-end test creates artifacts in the folder `src/e2e-tests/artifacts`. The artifacts contain the auto-generated .opossum file that the test was run against and a Playwright trace file.

The trace file includes screenshots and DOM snapshots at each step of the test up to the failure. You can open this file (do not unzip it!) in your browser by going to the [Playwright Trace Viewer](https://trace.playwright.dev/).

The artifacts just described are also available as a download on the GitHub actions summary tab of any build pipeline that failed due to an end-to-end test.

Last but not least, you can use the `debug` fixture to make any end-to-end test exit at a particular point in a test to then inspect the resulting .opossum file in OpossumUI:

```javascript
test('updates progress bar and confidence when user confirms preselected attributions in audit view', async ({
   attributionDetails,
   resourceBrowser,
   resourceDetails,
   topBar,
   debug,
}) => {
   await resourceBrowser.goto(resourceName1);
   await attributionDetails.assert.matchPackageInfo(packageInfo1);
   await topBar.assert.progressBarTooltipShowsValues({
      numberOfFiles: 4,
      filesWithOnlyPreSelectedAttributions: 4,
   });
   debug(); // the test will exit here
   await attributionDetails.assert.confirmButtonIsVisible();
   await attributionDetails.assert.confirmGloballyButtonIsVisible();
```

### Building the app

To build for a single OS run either `yarn ship-linux`, `yarn ship-mac` or `yarn ship-win`. To build for all three
systems run `yarn ship`. The built release(s) can be found under _/release_.

**Important:** [wine](https://www.winehq.org/) might be required to build a Windows installer on Linux.

## Creating a new release

Note: You will need the "maintain" role in order to create a new release.

### Checklist

1. **Test** on a large real-world example.
   1. Create a build for your OS using `yarn ship:auto` (see _/release_ folder).
   1. Check performances on a large .opossum file.
   1. Check that the layout does not break at lower resolutions (you can use View → Zoom in OpossumUI and resize the window, don't need to change resolution).
   1. Check that the performance of the save operation is good.
   1. Check that the notices for the app itself and chromium are accessible via the menu.
1. **Create** the release via UI (see next section for details).
1. Optional: Notify users about a new release.
   1. Wait until all the artifacts are shown on Github before sending a message.
   1. Briefly mention the most important changes.

### Creating a release

1. Go to the [GitHub releases page](https://github.com/opossum-tool/OpossumUI/releases/new) and use the UI to create a new release.
1. The tag should have the format "OpossumUI-2023-$MONTH-$DAY" (in case of an Nth release on the same day "OpossumUI-2023-$MONTH-$DAY.N").
1. The title of the release equals the tag.
1. Click the button "Generate release notes" to get the description for the release. Then, remove all the contributions from @renovate which are just dependency upgrades.
1. Click "Publish release". This will trigger the CI/CD pipeline which will build the release for all three OSs and upload the artifacts to the release.
