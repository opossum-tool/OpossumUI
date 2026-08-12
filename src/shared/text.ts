// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Criticality,
  type FileFilter,
  type FileFormatInfo,
} from './shared-types';

function menuLabelForFileFormat(fileFilter: FileFilter): string {
  return `${fileFilter.name} File (${fileFilter.extensions.map((ext) => `.${ext}`).join('/')})...`;
}

export const text = {
  menu: {
    file: 'File',
    fileSubmenu: {
      open: 'Open...',
      openRecent: 'Open Recent',
      clearRecent: 'Clear Recent',
      import: 'Import',
      importFileSubmenu: menuLabelForFileFormat,
      merge: 'Merge...',
      mergeIntoCurrentProject: 'Merge into current project…',
      split: 'Split…',
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
      showCriticality: 'Show Criticality',
      showClassifications: 'Show Classifications',
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
    compareConfirm: 'Compare',
    compareToOriginal: 'Compare with original',
    compareWith: 'Compare with…',
    compared: 'Compared',
    confidence: 'Confidence',
    confirm: 'Confirm',
    copyToClipboard: 'Copy to clipboard',
    copyToClipboardSuccess: 'Copied to clipboard',
    current: 'Current',
    delete: 'Delete',
    description: 'Description',
    enrichFailure: 'No component found with these coordinates',
    enrichNoop: 'No more information found',
    enrichSuccess: 'Added information where possible',
    fromAttributions: 'From Attributions',
    fromSignals: 'From Signals',
    getUrlAndLegal:
      'Get missing upstream URL and legal information from the web',
    homepage: 'Homepage',
    invalidPurl: 'INVALID PURL',
    legalInformation: 'Legal Information',
    licenseExpression: 'License Expression / Name',
    licenseText: 'License Text',
    licenseTextDefault: 'License Text (inferred from license name)',
    link: 'Link as attribution on selected resource',
    noLinkToOpen: 'No link to open. Please enter a URL.',
    occurrence: 'occurrence',
    openLinkInBrowser: 'Open in browser',
    openSourceInsights: 'Open Source Insights',
    origin: 'Origin',
    original: 'Original',
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
    upstreamAddress: 'Upstream Address',
    restore: 'Restore',
    revert: 'Revert',
    save: 'Save',
    sectionTitle: (prefix: string, section: string) =>
      prefix ? `${prefix} ${section}` : section,
    selected: 'Selected',
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
    readonlyAttribution: 'Readonly attribution',
    readonlyAttributionLabel: 'readonly attribution',
    readonlyAttributionCannotBeSelected: 'This attribution is readonly',
    readonlySignalLabel: 'readonly signal',
    readonlySignalCannotBeSelected: 'This signal is readonly',
    restore: 'Restore',
    scrollToBottom: 'Scroll to bottom',
    scrollToTop: 'Scroll to top',
    selectAll: 'Select all',
    selectComparisonAttribution: 'Please select an attribution to compare with',
    selectComparisonSignal: 'Please select a signal to compare with',
    selectLicense: 'Select a license',
    selectMissingAttribute: 'Select missing attributes',
    selectReplacement: 'Please select an attribution as replacement',
    showDeleted: 'Show deleted',
    signal: 'signal',
    signalsPanelTitle: 'Signals',
    moreActions: 'More actions',
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
    tabs: {
      overview: 'Overview',
      details: 'Licenses',
    },
    toggleStartupCheckbox: 'Show project statistics on startup',
    criticalLicensesSignalCountColumnName: 'Signals Count',
    charts: {
      attributionProperties: {
        title: 'Attributions Overview',
        needsReview: 'Needs Review',
        followUp: 'Follow Up',
        firstParty: 'First Party',
        incomplete: 'Incomplete Attributions',
        total: 'Total Attributions',
      },
      count: 'Number of Attributions',
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
      },
      incompleteAttributionsPieChart: {
        title: 'Incomplete Attributions',
        completeAttributions: 'Complete Attributions',
        incompleteAttributions: 'Incomplete Attributions',
      },
      noLicense: 'No License',
    },
  },
  attributionCountPerSourcePerLicenseTable: {
    footerTitle: 'Total',
    columns: {
      licenseInfo: 'License Info',
      signalCountPerSource: 'Signal Count per Source',
      licenseName: 'Name',
      criticality: {
        title: 'Criticality',
        medium: 'Medium Criticality',
        high: 'High Criticality',
      },
      classification: 'Classification',
      totalSources: 'Total',
    },
    none: '-',
  },
  unsavedChangesPopup: {
    title: 'Unsaved Changes',
    message: 'You have unsaved changes. What would you like to do?',
    discard: 'Discard and Proceed',
  },
  resourceBrowser: {
    allResources: (selectedResources: number, totalCount: number) =>
      `Resources (${new Intl.NumberFormat().format(selectedResources)} / ${new Intl.NumberFormat().format(totalCount)})`,
    splitHere: 'Split here',
    linkedResources: (selectedResources: number, totalCount: number) =>
      `Linked Resources (${new Intl.NumberFormat().format(selectedResources)} / ${new Intl.NumberFormat().format(totalCount)})`,
    hasHighlyCriticalSignals: 'Has highly critical signals',
    hasMediumCriticalSignals: 'Has medium critical signals',
    hasSignals: 'Has signals',
    readonlyResource: 'This resource is readonly',
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
    invalid: 'This field contains invalid characters',
    incomplete: 'This field is required',
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
  confirmAttributionActionPopup: {
    attribution: 'attribution',
    linkedResources: 'Linked resources',
    editableLinkedResources: 'Editable linked resources',
    mixedWarning: (count: number, attributions: string) =>
      `${count} ${attributions} are linked to both editable and read-only resources. The ${attributions} will be cloned and changes will affect only the new ${attributions}.`,
  },
  saveAttributionsPopup: {
    ariaLabel: 'confirm save popup',
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
    ariaLabel: 'confirm delete popup',
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
    mixedWarning: (count: number) =>
      count === 1
        ? '1 attribution is linked to both editable and read-only resources. It will be removed from the affected editable resources but remain on the read-only resources.'
        : `${count} attributions are linked to both editable and read-only resources. They will be removed from the affected editable resources but remain on the read-only resources.`,
  },
  filters: {
    any: 'Any',
    currentlyPreferred: 'Currently Preferred',
    excludedFromNotice: 'Excluded from Notice',
    firstParty: 'First Party',
    highConfidence: 'High Confidence',
    licenses: 'Licenses',
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
    unreviewed: 'Unreviewed',
    missingUrl: 'URL',
    missingPackageName: 'Component Name',
    missingPackageType: 'Component Type',
    missingPackageNamespace: 'Component Namespace',
    missingCopyright: 'Copyright',
    missingLicenseInformation: 'License Information',
    selectedMissingUrl: 'Missing URL',
    selectedMissingPackageName: 'Missing Component Name',
    selectedMissingPackageType: 'Missing Component Type',
    selectedMissingPackageNamespace: 'Missing Component Namespace',
    selectedMissingCopyright: 'Missing Copyright',
    selectedMissingLicenseInformation: 'Missing License Information',
  },
  sortings: {
    criticality: 'By Criticality',
    name: 'By Name',
    occurrence: 'By Occurrence',
    classification: 'By Classification',
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
    title: 'Compare',
    compareWith: 'Compare with',
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
    importIntoCurrentProject: 'Import into current project',
    currentProjectWarning:
      'The current project will be backed up before importing.',
    inputFilePath: {
      label: (fileFormat: FileFormatInfo) =>
        `File to import (${fileFormat.extensions.map((ext) => `.${ext}`).join('/')})`,
      selectLabel: (fileFormat: FileFormatInfo) =>
        `Select file to import (${fileFormat.extensions.map((ext) => `.${ext}`).join('/')})`,
    },
    opossumFilePath: {
      label: 'Opossum file save location',
      selectLabel: 'Select Opossum file save location',
    },
  },
  mergeOpossumFilesDialog: {
    mergeIntoCurrentProject: 'Merge into current project',
    title: 'Merge split Opossum files',
    titleForCurrentFile: 'Merge split files into current file',
    explanationText:
      'Select split Opossum files and an output location to merge them.',
    explanationTextForCurrentFile:
      'Select the split Opossum files to merge into the currently open file.',
    filesToMerge: 'Files to merge',
    currentFile: 'Current file',
    addSplitFiles: 'Add split files…',
    removeSplitFile: (filePath: string) => `Remove ${filePath}`,
    mergeIgnoringReadonlyResourceOutputConflicts: 'Merge anyway',
    readonlyResourceOutputConflictWarning:
      'Readonly resource outputs conflict. Merging anyway uses the output from the first file for the conflicting paths.',
    noReadonlyPathsWarning:
      'The current project has not been split, so merging is not possible.',
    outputFilePath: {
      label: 'Merged Opossum file location',
      selectLabel: 'Select merged Opossum file location',
    },
  },
  splitDialog: {
    title: 'Split Opossum file',
    explanationText:
      'Create a separate Opossum file for collaborative work. Selected resources will become readonly in the currently open Opossum file.',
    resourcePicker: {
      collapse: (path: string) => `collapse ${path}`,
      expand: (path: string) => `expand ${path}`,
      explanationText:
        'Select the resources that will be editable in the new Opossum file.',
      loadingResources: 'Loading resources…',
      noResourcesSelected: 'No resources selected',
    },
    destinationPath: {
      label: 'New Opossum file location',
      selectLabel: 'Select new Opossum file save location',
    },
    create: 'Split',
    inProgress: 'Splitting Opossum file…',
    success: 'Opossum file split successfully.',
  },
  backendError: {
    inputFileDoesNotExist: 'Input file does not exist',
    inputFilePermissionError: 'Permission error: cannot read input file',
    fileConverterExecutionFailed: (fileTypeName: string) =>
      `Unable to execute the Opossum file converter for ${fileTypeName} input files`,
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
      attributionBar: {
        intro: 'Number of files',
        selectLabel: 'Attributions',
        ariaLabel: 'Progress bar for attribution progress',
        filesWithManualAttribution: 'with attributions',
        filesWithOnlyPreSelectedAttribution:
          'with only pre-selected attributions',
        filesWithOnlyExternalAttribution: 'with only signals',
        filesWithNeitherAttributionsOrSignals:
          'with neither attributions or signals',
      },
      criticalityBar: {
        intro: 'Number of resources with signals and no attributions',
        selectLabel: 'Criticalities',
        ariaLabel: 'Progress bar for to be handled critical signals',
        filesWithHighlyCriticalSignals: 'containing highly critical signals',
        filesWithMediumCriticalSignals: 'containing medium critical signals',
        filesWithOnlyNonCriticalSignals: 'containing only non-critical signals',
      },
      classificationBar: {
        intro: 'Number of resources with signals and no attributions',
        selectLabel: 'Classifications',
        ariaLabel: 'Progress bar for to be handled classifications',
        containingClassification: 'containing classification',
        withoutClassification: 'without classification',
      },
    },
  },
} as const;
