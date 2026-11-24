# File formats

Files with a `.opossum` extension are zip-archives containing:

- `input.json` (required): the resource tree, signals and project metadata.
- `output.json` (optional): the audit results.
- `split-info.json` (optional): read-only rules for split projects.

JSON schemas for the [input](../src/ElectronBackend/input/OpossumInputFileSchema.json),
[output](../src/ElectronBackend/input/OpossumOutputFileSchema.json) and
[split metadata](../src/ElectronBackend/input/OpossumSplitInfoSchema.json) files describe the fields in detail.
Example files can be found under [example files](../example-files/).

### Input file

It has to be generated through external tools and provided to the app. Contains four required main fields:

- `metadata`: contains some project-level information,
- `resources`: defines the file tree,
- `externalAttributions`: contains all attributions which are provided as signals (preselected signals will be
  automatically used by the app to create attributions in the output file),
- `resourcesToAttributions`: links attributions to file paths,

There are additional fields which are optional:

- `config.classifications`: a mapping of non-negative integer classification values (as JSON object keys) to human-readable labels.
  Signals refer to these values through their `classification` field. By convention, zero represents unrestricted usage and higher values indicate increasing restrictions.
- `frequentLicenses`: A list of licenses that can be selected in a dropdown when the user enters a license name.
- `attributionBreakpoints`: a list of folder paths where attribution inference stops, e.g. `node_modules`.
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

Entries in `manualAttributions` can contain an optional `aiAttributions` object with metadata about AI-generated attributions:

- `humanModified`: an optional boolean indicating whether a human has modified the attribution.
- `deferredFields`: an optional object containing metadata about fields requiring human review. Its presence, even as an empty object, marks the attribution as deferred.

Additional properties in `aiAttributions` are preserved when loading and saving the file.

### Split metadata

When a project is split for collaborative work, `split-info.json` stores a non-empty `readonlyRules` array.
Each rule contains a resource `path` and a `readonly` boolean describing access to that part of the resource tree.
OpossumUI uses these rules to restrict editing in the split files and merge their results later.
