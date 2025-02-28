// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { FileFormatInfo } from './shared-types';

function menuLabelForFileFormat(fileFormat: FileFormatInfo): string {
  return `${fileFormat.name} File (${fileFormat.extensions.map((ext) => `.${ext}`).join('/')})...`;
}

export const text = {
  menu: {
    file: 'File',
    fileSubmenu: {
      open: 'Open...',
      import: 'Import',
      importSubmenu: menuLabelForFileFormat,
      merge: 'Merge',
      mergeSubmenu: menuLabelForFileFormat,
      save: 'Save',
      projectMetadata: 'Project Metadata',
      projectStatistics: 'Project Statistics',
      setBaseURL: 'Set Path to Sources',
      quit: 'Quit',
      export: 'Export',
      exportSubmenu: {
        followUp: 'Follow-Up',
        compactComponentList: 'Compact Component List',
        detailedComponentList: 'Detailed Component List',
        spdxYAML: 'SPDX (yaml)',
        spdxJSON: 'SPDX (json)',
      },
    },
    edit: 'Edit',
    editSubmenu: {
      undo: 'Undo',
      redo: 'Redo',
      cut: 'Cut',
      copy: 'Copy',
      paste: 'Paste',
      selectAll: 'Select All',
      searchAttributions: 'Search Attributions',
      searchSignals: 'Search Signals',
      searchResourcesAll: 'Search All Resources',
      searchResourceLinked: 'Search Linked Resources',
    },
    view: 'View',
    viewSubmenu: {
      showDevTools: 'Show Developer Tools',
      toggleFullScreen: 'Full Screen',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      qaMode: 'QA Mode',
    },
    about: 'About',
    aboutSubmenu: {
      openOnGithub: 'Open on GitHub',
      opossumUINotices: 'OpossumUI Notices',
      chromiumNotices: 'Chromium Notices',
    },
    help: 'Help',
    helpSubmenu: {
      openLogFiles: 'Open Log Files Folder',
      checkForUpdates: 'Check for Updates',
      userGuide: 'User Guide',
    },
  },
  attributionColumn: {
    commonEcosystems: 'Common Ecosystems',
    commonLicenses: 'Common Licenses',
    compareToOriginal: 'Compare to original signal',
    confidence: 'Confidence',
    confirm: 'Confirm',
    copyToClipboard: 'Copy to clipboard',
    copyToClipboardSuccess: 'Copied to clipboard',
    currentLicenseInformation: 'Current License Information',
    currentPackageCoordinates: 'Current Component Coordinates',
    delete: 'Delete',
    description: 'Description',
    enrichFailure: 'No component found with these coordinates',
    enrichNoop: 'No more information found',
    enrichSuccess: 'Added information where possible',
    fromAttributions: 'From Attributions',
    fromSignals: 'From Signals',
    getUrlAndLegal: 'Get missing URL and legal information from the web',
    homepage: 'Homepage',
    invalidPurl: 'INVALID PURL',
    legalInformation: 'Legal Information',
    licenseExpression: 'License Expression',
    licenseText: 'License Text',
    licenseTextDefault: 'License Text (inferred from license name)',
    link: 'Link as attribution on selected resource',
    noLinkToOpen: 'No link to open. Please enter a URL.',
    occurrence: 'occurrence',
    openLinkInBrowser: 'Open component URL in browser',
    openSourceInsights: 'Open Source Insights',
    origin: 'Origin',
    originalLicenseInformation: 'Original License Information',
    originalPackageCoordinates: 'Original Component Coordinates',
    originallyFrom: 'Originally from ',
    packageCoordinates: 'Component Coordinates',
    packageName: 'Component Name',
    packageNamespace: 'Component Namespace',
    packageType: 'Component Type',
    packageVersion: 'Component Version',
    pasteFromClipboard: 'Paste from clipboard',
    pasteFromClipboardFailed: 'Clipboard does not contain a valid PURL',
    pasteFromClipboardSuccess: 'Pasted from clipboard',
    purl: 'PURL',
    replace: 'Use as replacement',
    repositoryUrl: 'Component URL',
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
    import: 'Import',
    merge: 'Merge',
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
    criticalLicensesSignalCountColumnName: 'Signals Count',
    charts: {
      licenseCountsTable: 'Signals per Sources',
      attributionPropertyCountTable: 'Attributions Overview',
      criticalLicensesTable: 'Critical Licenses',
      pieChartsSectionHeader: 'Pie Charts',
      mostFrequentLicenseCountPieChart: 'Most Frequent Licenses',
      criticalSignalsCountPieChart: {
        title: 'Signals by Criticality',
        highlyCritical: 'Highly Critical Signals',
        mediumCritical: 'Medium Critical Signals',
        nonCritical: 'Non-Critical Signals',
      },
      signalCountByClassificationPieChart: {
        title: 'Signals by Classification',
        noClassification: 'No classification',
      },
      incompleteAttributionsPieChart: 'Incomplete Attributions',
    },
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
    [Criticality.High]: 'High Criticality',
    [Criticality.Medium]: 'Medium Criticality',
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
    incompleteCoordinates: 'Incomplete Component Coordinates',
    incompleteLegal: 'Incomplete Legal Information',
    lowConfidence: 'Low Confidence',
    modifiedPreferred: 'Modified Previously Preferred',
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
    outdatedAppVersion:
      'This might be caused by an outdated version of the app. Make sure you are using the newest version of the app to open the file.',
    unexpectedError: "We're sorry, an unexpected error occurred!",
    relaunch: 'Relaunch App',
    quit: 'Quit App',
  },
  importDialog: {
    title: (fileFormat: FileFormatInfo) => `Import ${fileFormat.name} file`,
    explanationText: [
      'OpossumUI will convert the selected file into a new Opossum file.',
      'All changes made to the project in OpossumUI will be saved in this Opossum file.',
    ],
    inputFilePath: {
      textFieldLabel: (fileFormat: FileFormatInfo, hasBeenSelected: boolean) =>
        hasBeenSelected
          ? `File to import (${fileFormat.extensions.map((ext) => `.${ext}`).join('/')})`
          : `Select file to import (${fileFormat.extensions.map((ext) => `.${ext}`).join('/')})`,
    },
    opossumFilePath: {
      textFieldLabel: (hasBeenSelected: boolean) =>
        hasBeenSelected
          ? 'Opossum file save location'
          : 'Select Opossum file save location',
    },
  },
  mergeDialog: {
    title: (fileFormat: FileFormatInfo) =>
      `Merge ${fileFormat.name} file into current file`,
    explanationText:
      'OpossumUI will merge the selected file into the currently open Opossum file.',
    warningText:
      'As this action cannot be undone, OpossumUI will also create a backup of the currently open Opossum file.',
    inputFilePath: {
      textFieldLabel: (fileFormat: FileFormatInfo, hasBeenSelected: boolean) =>
        hasBeenSelected
          ? `File to merge (${fileFormat.extensions.map((ext) => `.${ext}`).join('/')})`
          : `Select file to merge (${fileFormat.extensions.map((ext) => `.${ext}`).join('/')})`,
    },
  },
  backendError: {
    inputFileDoesNotExist: 'Input file does not exist',
    inputFilePermissionError: 'Permission error: cannot read input file',
    inputFileInvalid: (fileTypeName: string) =>
      `Input file is not a valid ${fileTypeName} file`,
    opossumFileNotSelected: 'No .opossum save location selected',
    opossumFileWrongExtension: 'Output file name must have .opossum extension',
    opossumFileDirectoryDoesNotExist: 'Output directory does not exist',
    opossumFilePermissionError:
      'Permission error: cannot write to output directory',
    noOpenFileToMergeInto: 'No open file to merge into',
    cantCreateBackup: 'Unable to create backup of currently open Opossum file',
  },
  topBar: {
    openFile: {
      ariaLabel: 'open file icon',
      toolTipTitle: 'open file',
    },
    audit: 'Audit',
    report: 'Report',
    switchableProgressBar: {
      selectAriaLabel: 'ProgressBar Switcher',
      criticalSignalsBar: {
        selectLabel: 'Criticalities',
        ariaLabel: 'Progress bar for to be handled critical signals',
      },
      attributionProgressBar: {
        selectLabel: 'Attributions',
        ariaLabel: 'Progress bar for attribution progress',
      },
      classificationProgressBar: {
        selectLabel: 'Classifications',
        ariaLabel: 'Progress bar for to be handled classifications',
      },
    },
  },
} as const;
