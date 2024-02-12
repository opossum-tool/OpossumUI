// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
export const text = {
  attributionColumn: {
    packageSubPanel: {
      confidence: 'Confidence',
      copyToClipboard: 'Copy to clipboard',
      noLinkToOpen: 'No link to open. Please enter a URL.',
      openLinkInBrowser: 'Open repository URL in browser',
      packageName: 'Package Name',
      packageNamespace: 'Package Namespace',
      packageType: 'Package Type',
      packageVersion: 'Package Version',
      pasteFromClipboard: 'Paste from clipboard',
      purl: 'PURL',
      repositoryUrl: 'Repository URL',
      searchForPackage: 'Search for package information',
    },
    amongSignals: 'among signals',
    commonEcosystems: 'Common Ecosystems',
    commonLicenses: 'Common Licenses',
    copyToClipboardSuccess: 'Copied to clipboard',
    description: 'Description',
    enrichFailure: 'No package found with these coordinates',
    enrichSuccess: 'Added information where possible',
    enrichNoop: 'No more information found',
    getUrlAndLegal: 'Get missing URL and legal information from the web',
    homepage: 'Homepage',
    invalidPurl: 'INVALID PURL',
    legalInformation: 'Legal Information',
    licenseName: 'License Name',
    licenseTextModified: '(License text modified)',
    manualAttributions: 'Manual Attributions',
    occurrence: 'occurrence',
    openSourceInsights: 'Open Source Insights',
    origin: 'Origin',
    originallyFrom: 'Originally from ',
    packageCoordinates: 'Package Coordinates',
    pasteFromClipboardFailed: 'Clipboard does not contain a valid PURL',
    pasteFromClipboardSuccess: 'Pasted from clipboard',
    source: 'Source',
    useAutocompleteSuggestion:
      'Adopt all coordinates and legal information from suggestion',
    sortTooltip: 'Sort',
    filterTooltip: 'Filter',
  },
  attributionList: {
    attribution: 'attribution',
    confirmSelected: 'Confirm Selected',
    deleteSelected: 'Delete Selected',
    replaceSelected: 'Replace Selected',
    unknownSource: 'Unknown Source',
  },
  buttons: {
    cancel: 'Cancel',
    compareToOriginal: 'Compare to original',
    confirm: 'Confirm',
    filter: 'Filter',
    sort: 'Sort',
    diffPopup: {
      applyChanges: 'Apply changes',
      revertAll: 'Revert all',
    },
  },
  changePreferredStatusGloballyPopup: {
    markAsPreferred: 'Do you really want to prefer the attribution globally?',
    unmarkAsPreferred:
      'Do you really want to remove the preferred status globally?',
  },
  modifyWasPreferredPopup: {
    header: 'Warning',
    message:
      'You are about to modify an attribution that was preferred in the past. Are you sure you want to continue? The attribution will no longer be marked with a',
  },
  processPopup: {
    title: 'Processing…',
  },
  projectStatisticsPopup: {
    toggleStartupCheckbox: 'Show project statistics on startup',
  },
  auditingOptions: {
    add: 'Add Auditing Option',
    confidence: 'Confidence',
    currentlyPreferred: 'Currently Preferred',
    excludedFromNotice: 'Excluded from Notice',
    followUp: 'Needs Follow-Up',
    modifiedPreferred: 'Modified Previously Preferred',
    needsReview: 'Needs Review by QA',
    preselected: 'Pre-selected',
    previouslyPreferred: 'Previously Preferred',
  },
  locatorPopup: {
    onlySearchLicenseNames: 'Only search license names',
    license: 'License',
  },
  errors: {
    unknown: 'unknown',
  },
  updateAppPopup: {
    title: 'Check for updates',
    noUpdateAvailable: 'You have the latest version of OpossumUI installed.',
    updateAvailable: 'There is a newer version of OpossumUI available:',
    fetchFailed: (message: string) =>
      `Failed to fetch latest release information: ${message}`,
  },
  replaceAttributionsPopup: {
    replace: 'Replace',
    removeAttributions: (attributions: string) =>
      `This action will remove the following ${attributions}:`,
    selectReplacement: 'Please select another attribution as a replacement:',
    title: 'Replace Attributions',
  },
  deleteAttributionsPopup: {
    title: 'Delete Attributions',
    deleteAttributions: (attributions: string) =>
      `Do you really want to delete ${attributions} globally?`,
  },
  filters: {
    currentlyPreferred: 'Currently Preferred',
    excludedFromNotice: 'Excluded from Notice',
    firstParty: 'First Party',
    incomplete: 'Incomplete',
    lowConfidence: 'Low Confidence',
    needsFollowUp: 'Needs Follow-Up',
    needsReview: 'Needs Review by QA',
    preSelected: 'Pre-selected',
    previouslyPreferred: 'Previously Preferred',
    thirdParty: 'Third Party',
  },
  sortings: {
    criticality: 'By Criticality',
    name: 'By Name',
    occurrence: 'By Occurrence',
  },
  resourceDetails: {
    searchTooltip: 'Search',
    sortTooltip: 'Sort',
  },
  diffPopup: {
    title: 'Compare to Original Signal',
  },
} as const;
