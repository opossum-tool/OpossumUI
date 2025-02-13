# File formats

Files with a `.opossum` extension are zip-archives which contain an `input.json` (must be provided) together with an `output.json` (optional).
JSON schemas for both the [input](../src/ElectronBackend/input/OpossumInputFileSchema.json)
and [output](../src/ElectronBackend/input/OpossumOutputFileSchema.json) files are available. Example files can be found
under [example files](example-files/).

### Input file

It has to be generated through external tools and provided to the app. Contains 5 main fields:

- `metadata`: contains some project-level information,
- `resources`: defines the file tree,
- `externalAttributions`: contains all attributions which are provided as signals (preselected signals will be
  automatically used by the app to create attributions in the output file),
- `resourcesToAttributions`: links attributions to file paths,

There are additional fields which are optional:

- `frequentLicenses`: A list of licenses that can be selected in a dropdown when the user enters a license name.
- `attributionBreakpoints`: a list of folder paths where attribution inference stops, e.g. `node_modules`."
- `filesWithChildren`: a list of folders that are treated as files. This can be used to attach another file tree to
  files like `package.json`, usually also setting an attribution breakpoint.
- `baseUrlsForSources`: a map from paths to the respective base url. The base url should contain a {path} placeholder.
  E.g.

  ```json
  "baseUrlsForSources": {
    "/": "https://github.com/opossum-tool/opossumUI/blob/main/{path}"
  }
  ```

- `externalAttributionSources`: used to store a mapping of short names for attribution sources to full names and priorities used for sorting in the PackagePanel. Entries with higher numbers have a higher priority. E.g.:

  ```json
  "externalAttributionSources": {
    "SC": {
      "name": "ScanCode",
      "priority": 1
    }
  }
  ```

### Output file

Contains four main fields:

- `metadata`: contains some project-level information,
- `manualAttributions`: contains all attributions created by the user or preselected,
- `resourcesToAttributions`: links attributions to file paths,
- `resolvedExternalAttributions`: used to store which signal attributions have been resolved, as they are hidden in the
  UI.
