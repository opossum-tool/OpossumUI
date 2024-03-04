// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
export const text = {
  attributionColumn: {
    commonEcosystems: 'Common Ecosystems',
    commonLicenses: 'Common Licenses',
    compareToOriginal: 'Compare to original signal',
    confidence: 'Confidence',
    confirm: 'Confirm',
    copyToClipboard: 'Copy to clipboard',
    copyToClipboardSuccess: 'Copied to clipboard',
    currentLicenseInformation: 'Current License Information',
    currentPackageCoordinates: 'Current Package Coordinates',
    delete: 'Delete',
    description: 'Description',
    enrichFailure: 'No package found with these coordinates',
    enrichNoop: 'No more information found',
    enrichSuccess: 'Added information where possible',
    fromAttributions: 'From Attributions',
    fromSignals: 'From Signals',
    getUrlAndLegal: 'Get missing URL and legal information from the web',
    homepage: 'Homepage',
    invalidPurl: 'INVALID PURL',
    legalInformation: 'Legal Information',
    licenseName: 'License Name',
    licenseTextModified: '(License text modified)',
    link: 'Link as attribution on selected resource',
    noLinkToOpen: 'No link to open. Please enter a URL.',
    occurrence: 'occurrence',
    openLinkInBrowser: 'Open repository URL in browser',
    openSourceInsights: 'Open Source Insights',
    origin: 'Origin',
    originalLicenseInformation: 'Original License Information',
    originalPackageCoordinates: 'Original Package Coordinates',
    originallyFrom: 'Originally from ',
    packageCoordinates: 'Package Coordinates',
    packageName: 'Package Name',
    packageNamespace: 'Package Namespace',
    packageType: 'Package Type',
    packageVersion: 'Package Version',
    pasteFromClipboard: 'Paste from clipboard',
    pasteFromClipboardFailed: 'Clipboard does not contain a valid PURL',
    pasteFromClipboardSuccess: 'Pasted from clipboard',
    purl: 'PURL',
    replace: 'Use as replacement',
    repositoryUrl: 'Repository URL',
    restore: 'Restore',
    revert: 'Revert',
    save: 'Save',
    source: 'Source',
    unlink: 'Unlink',
    useAutocompleteSuggestion:
      'Adopt all coordinates and legal information from suggestion',
  },
  packageLists: {
    attribution: 'attribution',
    attributionsPanelTitle: 'Attributions',
    cancelReplace: 'Cancel replace',
    clearFilters: 'Clear filters',
    confirm: 'Confirm',
    create: 'Create new attribution',
    delete: 'Delete',
    deselectAll: 'Deselect all',
    firstParty: 'First Party',
    hideDeleted: 'Hide deleted',
    incompleteAttributions: 'This resource has incomplete attributions',
    incompleteInformation: 'Incomplete Information',
    jumpNext: 'Jump to next section',
    jumpPrevious: 'Jump to previous section',
    jumpStart: 'Jump to section start',
    linkAsAttribution: 'Link as attribution on selected resource',
    replace: 'Replace',
    restore: 'Restore',
    scrollToBottom: 'Scroll to bottom',
    scrollToTop: 'Scroll to top',
    selectAll: 'Select all',
    selectLicense: 'Select a license',
    selectReplacement: 'Please select an attribution as replacement',
    showDeleted: 'Show deleted',
    signal: 'signal',
    signalsPanelTitle: 'Signals',
  },
  buttons: {
    cancel: 'Cancel',
    close: 'Close',
    filter: 'Filter',
    ok: 'OK',
    search: 'Search',
    sort: 'Sort',
  },
  modifyWasPreferredPopup: {
    title: 'Modifying Previously Preferred Attribution',
    message:
      'You are about to modify an attribution that was preferred in the past. Are you sure you want to continue? The attribution will no longer be marked with a',
  },
  processPopup: {
    title: 'Processing…',
  },
  projectStatisticsPopup: {
    title: 'Project Statistics',
    toggleStartupCheckbox: 'Show project statistics on startup',
  },
  unsavedChangesPopup: {
    title: 'Unsaved Changes',
    message: 'You have unsaved changes. What would you like to do?',
    discard: 'Discard and Proceed',
  },
  resourceBrowser: {
    allResources: (count: number) =>
      `All Resources (${new Intl.NumberFormat().format(count)})`,
    linkedResources: (count: number) =>
      `Linked Resources (${new Intl.NumberFormat().format(count)})`,
    hasHighlyCriticalSignals: 'Has highly critical signals',
    hasMediumCriticalSignals: 'Has medium critical signals',
    hasSignals: 'Has signals',
  },
  auditingOptions: {
    add: 'Add Auditing Option',
    confidence: 'Confidence',
    currentlyPreferred: 'Currently Preferred',
    excludedFromNotice: 'Excluded from Notice',
    followUp: 'Needs Follow-Up',
    highCriticality: 'High Criticality',
    mediumCriticality: 'Medium Criticality',
    modifiedPreferred: 'Modified Previously Preferred',
    needsReview: 'Needs Review by QA',
    preselected: 'Pre-selected',
    previouslyPreferred: 'Previously Preferred',
  },
  generic: {
    unknown: 'unknown',
    noResults: 'No Results',
  },
  updateAppPopup: {
    fetchFailed: (message: string) =>
      `Failed to fetch latest release information: ${message}`,
    loading: 'Loading…',
    noUpdateAvailable: 'You have the latest version of OpossumUI installed.',
    title: 'Check for Updates',
    updateAvailable: 'There is a newer version of OpossumUI available:',
  },
  replaceAttributionsPopup: {
    replace: 'Replace',
    removeAttributions: (attributions: string) =>
      `This action will remove the following ${attributions}:`,
    replacement: 'The replacement will be:',
    title: 'Replace Attributions',
  },
  saveAttributionsPopup: {
    titleSave: 'Save Attributions',
    titleConfirm: 'Confirm Attributions',
    saveAttributions: ({
      attributions,
      resources,
    }: {
      attributions: string;
      resources: string;
    }) =>
      `This action will save the following ${attributions} on ${resources}:`,
    confirmAttributions: ({
      attributions,
      resources,
    }: {
      attributions: string;
      resources: string;
    }) =>
      `This action will confirm the following ${attributions} on ${resources}:`,
    saveGlobally: 'Save on All',
    confirmGlobally: 'Confirm on All',
    saveLocally: 'Save only on Selected',
    confirmLocally: 'Confirm only on Selected',
    save: 'Save',
    confirm: 'Confirm',
    resource: 'resource',
  },
  deleteAttributionsPopup: {
    title: 'Delete Attributions',
    deleteAttributions: ({
      attributions,
      resources,
    }: {
      attributions: string;
      resources: string;
    }) =>
      `This action will permanently remove the following ${attributions} from ${resources}:`,
    deleteGlobally: 'Delete on All',
    deleteLocally: 'Delete only on Selected',
    delete: 'Delete',
    resource: 'resource',
  },
  filters: {
    currentlyPreferred: 'Currently Preferred',
    excludedFromNotice: 'Excluded from Notice',
    firstParty: 'First Party',
    highConfidence: 'High Confidence',
    incompleteCoordinates: 'Incomplete Package Coordinates',
    incompleteLegal: 'Incomplete Legal Information',
    lowConfidence: 'Low Confidence',
    modifiedPreviouslyPreferred: 'Modified Previously Preferred',
    needsFollowUp: 'Needs Follow-Up',
    needsReview: 'Needs Review by QA',
    notExcludedFromNotice: 'Not excluded from Notice',
    notPreSelected: 'Not pre-selected',
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
  relations: {
    children: 'On Children',
    unrelated: 'Unrelated',
    parents: 'On Parents',
    resource: 'On Resource',
  },
  reportView: {
    openInAuditView: 'Open in Audit View',
  },
  diffPopup: {
    title: 'Compare to Original Signal',
    applyChanges: 'Apply changes',
    revertAll: 'Revert all',
  },
  errorBoundary: {
    unexpectedError: "We're sorry, an unexpected error occurred!",
    relaunch: 'Relaunch App',
    quit: 'Quit App',
  },
} as const;
