<!--
SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>

SPDX-License-Identifier: CC0-1.0
-->

# User's Guide

## Table of contents

1. [How to get & run OpossumUI](#get_and_run_OpossumUI)
   1. [Get the latest release](#get_latest_release)
   2. [Running the app](#running_the_app)
2. [Working with OpossumUI](#working_with_OpossumUI)
   1. [Opossum file format](#dot_opossum)
   2. [Json files](#json_files)
   3. [Opening a file](#opening_a_file)
   4. [Search](#search)
   5. [Locate signals](#locator)
   6. [Project Metadata](#project_metadata)
   7. [Project Statistics](#project_statistics)
   8. [Exporting Formats](#exporting_formats)
   9. [Attributions](#attributions)
   10. [Top Bar](#top_bar)
   11. [Audit View](#audit_view)
   12. [Attribution View](#attribution_view)
   13. [Report View](#report_view)
   14. [Preferred Attributions](#preferred_attributions)

## How to get & run OpossumUI <a name="get_and_run_OpossumUI"></a>

### Get the latest release <a name="get_latest_release"></a>

Download the latest release for your OS from [Github](https://github.com/opossum-tool/OpossumUI/releases/latest).

To check if your installation is up to date, open the `Help` menu and select `Check for updates`.

### Running the app <a name="running_the_app"></a>

#### Linux

Run the executable _OpossumUI-for-linux.AppImage_

#### macOS

Run _OpossumUI_ in _OpossumUI-for-mac.zip_.

#### Windows

Run _OpossumUI-for-win.exe_ to install the OpossumUI. Then open _OpossumUI_ from the start menu.

## Working with OpossumUI <a name="working_with_OpossumUI"></a>

### Opossum file format <a name="dot_opossum"></a>

Files with a `.opossum` extension are zip-archives which contain an _input.json_ (must be provided) together with an _output.json_ (optional). An output file will be automatically created and added to the archive after opening the archive if there is no such file yet.

### Json files <a name="json_files"></a>

Two .json files are used by the app to store data:

- an input file, that must be provided,
- an output file, which is created by the app when saving for the first time if not already present.

The output file must be in the same folder as the input file and called `[NAME_OF_THE_FIRST_FILE]_attributions.json`
to be recognized by the app.

### Opening a File <a name="opening_a_file"></a>

To open the input file in the app, click the _Open File_ button on the left of the top bar (or on the entry in the
_File_ menu with the same name).

![integration](./docs/user_guide_screenshots/open_file.png)

If you try to open a _.json_ file, a popup will be shown which asks whether you would like to create a `.opossum` file and proceed (recommended) or continue working with the old format (two separate _.json_ files).

### Search <a name="search"></a>

To search for a path, press `CTRL + F` or open the `Edit` menu and select `Search for Files and Folders`.

![integration](./docs/user_guide_screenshots/search.png)

### Locate signals <a name="locator"></a>

To locate signals, press `CTRL + L` or open the `Edit` menu and select `Locate Signals`. This will open the Locate Signals popup.
From here, you can choose which signals you want to locate in the resource tree. You can search for signals by string, criticality
or choose one or multiple existing license name(s). Once selected, the locations of matching signals will be highlighted in the resource tree.

Note: When searching for matching resources, the input of the search field, the selected criticality and the selected
license names are linked with **and**, while different license names in the license search field are linked with **or**.
That is, when searching for a license name using the search field (and the checkbox) and additionally selecting
another license name, only the resources matching the license name **and** the term in the search field will be highlighted
while when searching for multiple license names, all resources matching **one of these** licenses will be highlighted.

![integration](./docs/user_guide_screenshots/locator.png)

You can also locate signals by license from the [Project Statistics](#project_statistics) popup, by clicking on the locator icon next to each license.

![integration](./docs/user_guide_screenshots/locator_project_statistics.png)

### Project Metadata <a name="project_metadata"></a>

To view project metadata, open the `File` menu and select `Project Metadata`.

### Project Statistics <a name="project_statistics"></a>

To view project statistics, open the `File` menu and select `Project Statistics`. This opens a popup that shows various
tables and pie charts summarizing the state of the project.

### Exporting Formats <a name="exporting_formats"></a>

It is possible to directly export data to files. The following formats are available:

- Follow-Up: Just the items marked as follow-up are present in this file as csv file.
- Compact component list: All attributions not marked as follow-up or 1st Party are exported to a csv file. Attributions marked as "exclude from notice" are not exported.
- Detailed component list: All attributions not marked as follow-up or 1st Party are exported to a csv file.
- SPDX JSON: All attributions are listed as JSON file.
- SPDX YAML: All attributions are listed as YAML file.

To generate a document, open the `File` menu and select `Export`.

![integration](./docs/user_guide_screenshots/exports.png)

### Attributions <a name="attributions"></a>

The basic building block of license/attribution information in the opossumUI is the **Attribution**. An **Attribution**
isn't only a software package with name & version (or purl) and copyright, distributed under one or more licenses. It
can in principle be any file which has a copyright or is distributed under a license. **The purpose of the opossumUI is to
link resources to the corresponding attributions, with an emphasis on correct licensing and copyright information.**
In the opossumUI, a distinction between **signals** and **attributions** is made:

- **attributions** are attribution information that are created in the current run of the opossumUI. They are stored in
  the output file, together with the resources they have been linked to,
- **signals** are attribution information that have been linked to a resource before the current opossumUI run. They can
  come from automatic tools or previous run of the opossumUI. They have a **source** and can be used as starting point for
  assigning attributions.

### Top Bar <a name="top_bar"></a>

In the `Top Bar`, the following elements are present. From left to right:

- the _Open File_ button (read _Open File_ section to learn more about opening a file),
- the `Progress Bar` (shown only if a file is currently opened),
- the `Progress Bar Toggle`,
- the `View Switch`,
- the app version.

The `Progress Bar` indicates how many files have manually received an attribution (dark green), how many have an
automatically **pre-selected** attribution (lighter green with gradient), and how many files have a signal, but have not
yet received an attribution (orange), with respect to the total number of files. Hovering on the bar shows a tooltip
containing all 4 numbers. Clicking on the bar navigates to a file that has a signal, but no attribution.

![integration](./docs/user_guide_screenshots/top_bar.png)

Clicking the `Progress Bar Toggle` replaces the `Progress Bar` by the `Critical Signals Progress Bar`. The
`Critical Signals Progress Bar` indicates how many files have a highly critical signal but no attribution (red),
a medium critical signal but no attribution (orange) with respect to the total number of files not having an attribution.
Hovering on the bar shows a tooltip containing all 4 numbers. Clicking on the bar navigates to a file that has a critical signal,
but no attribution.

The `View Switch` allows to change between the `Audit View`, the `Attribution View`, and the `Report View` (the views
are described in more detail in the respective sections).

The app version is crucial to allow the development team to reproduce bugs: please always include it in
screenshots/videos/emails documenting a bug.

### Audit View <a name="audit_view"></a>

![integration](./docs/user_guide_screenshots/audit_view.png)

**Resource** is the generic name used throughout the app to indicate a file or a folder (as in many cases they are
treated the same). The `Audit View` focuses on the navigation through the resources to add/edit/remove attributions
while seeing which signals have been found by the remote tools. The page has two main components:

- a `Resource Tree` on the left,
- a `Selected Resource Panel` on the center right (shown only if a resource has been selected in the `Resource Tree`).

#### Folders and inferred attributions

In the case that a folder receives an attribution this attribution is also inferred to all its children that
do not have their own attribution. Therefore, adding an attribution to a folder affects its children if these
are not attributed themselves. The inference stops once a folder or a file is hit that has a differing attribution.

#### Resource Tree

In the `Resource Tree` resources can be selected. **Icons** help to find information in the folder
structure:

- a **file icon** ![integration](./docs/user_guide_screenshots/file_icon.png) indicates that the resource is a file,
- a **folder icon** ![integration](./docs/user_guide_screenshots/directory_icon.png) indicates that the resource is a folder,
- a **icon consisting of four squares** ![integration](./docs/user_guide_screenshots/breakpoint_icon.png) indicates that the resource is a breakpoint (**breakpoints** are special folders
  that are included to visually collect a set of dependencies. These folders cannot have any signal or attribution.
  Furthermore, no attribution is inferred beyond such a breakpoint),
- a **exclamation mark** ![integration](./docs/user_guide_screenshots/has_signals_icon.png) indicates the presence of signals attached to the resource.

![integration](./docs/user_guide_screenshots/filetree.png)

The coloring scheme reads as follows:

- **red** indicates the presence of signals but no attribution for the resource itself,
- **green** indicates the presence of attribution for the resource itself,
- **light red** indicates the presence of signals but no attribution in children,
- **light green** indicates the presence of attribution in children,
- **grey** indicates the absence of both, signals and attribution, in children,
- **blue** indicates the presence of signals in children but no attribution of the resource itself.

#### Selected Resource Panel

The `Selected Resource Panel` shows the path of the selected resource at the top. If the input file contains information
about the location of the file (`baseUrlsForSources`) an icon to externally open the file is shown.

Below the path, the element is divided into two columns. In the `Attribution Selection Column`, in the center of the
screen, attributions and signals related to the selected resource are listed. In the `Attribution Details Column` on
the right, additional information is shown for the selected attribution/signal.

![integration](./docs/user_guide_screenshots/selected_resource_panel.png)

##### Attribution Selection Column

In the `Attribution Selection Column` the following sub-panels may be present:

- `Attribution Sub-Panel` (always shown),
- `Signals Sub-Panel` (accessible via the `LOCAL` tab),
- `Attributions in Folder Content Sub-Panel` (accessible via the `LOCAL` tab),
- `Signals in Folder Content Sub-Panel` (accessible via the `LOCAL` tab),
- `Add to Attribution Sub-Panel` (accessible via the `GLOBAL` tab).

The `Attributions Sub-Panel` shows a list of all attributions that are assigned to the selected resource.
**Pre-selected** attributions are signaled by an `P` icon. They can be confirmed, therefore being considered
attributions in all views and in the progress bar. However, that is not a requirement. **Pre-selected** and
attributions are both written in the output file. Clicking on one of the
attributions, shows the details of that attribution in the `Attribution Details Column`. Clicking on _Add new
attribution_ shows a blank `Attribution Details Column` that allows for adding a new attribution to the list of
attributions, upon saving. If the shown attributions are inferred from a containing folder, they cannot be modified.
Instead, the
_OVERRIDE PARENT_ button can be clicked for creating new attributions for the selected resource. (Note that attributions
are not saved separately, if they are identical to the attributions of a containing folder and can thus be inferred.)

The `Signals Sub-Panel`, `Attributions in Folder Content Sub-Panel` and `Signals in Folder Content Sub-Panel` show lists
of the signals of the selected resource and the attributions and signals of the resources contained within the selected
folder. Clicking on the one of the listed items, shows the details of the respective attribution/signal in the
`Attribution Details Column`. By clicking the **+ icon** of an item, the respective attribution/signal can be added to
the attributions of the selected resource. In the `Signals Sub-Panel` signals that were used to create the pre-selected
attributions are shown with a `P` icon, even if the relative attributions have been deleted. The cards in the
` ... in folder content` sub-panels also show the number of resources in the folder that are linked to the shown
attribution.

Similar signals that deviate only by `comment`, `attributionConfidence`, `originIds`, or the `preSelected` flag are merged into a single signal with multiple comments according to the comments of the individual merged signals. When adding a merged signal to the attributions of the current resource, the comment of the resulting attribution is empty. Relevant parts can be copied from the merged signal.

The `Add to Attribution Sub-Panel` allows to add an existing attribution to the attributions of the selected resource.
As in the other panels, the details of the attributions can be shown by clicking on the respective list item, while the
attribution can be added by clicking on the corresponding **+ icon**.

##### Attribution Wizard

The `Attribution Wizard` can be opened via the context menu of a manual attribution. It aggregates information from attributions and signals of the current resource and its descendents and provides a structured overview. By clicking through the wizard, package namespace, name, and version can be selected and saved to the `Attribution Details Column` of the attribution from which the wizard has been opened.

The `Attribution Wizard` has the following structure (compare image):

- Path of the selected resource (1).
- Breadcrumbs for navigation (2). Each breadcrumb corresponds to a step of the wizard.
- Package URL (3) that describes the currently selected package.
- Lists of aggregated package attributes (4), e.g., package namespace, name, and version (depending on wizard step).

![integration](./docs/user_guide_screenshots/attribution_wizard_doc_overview.png)

In the first step, package namespace and name can be selected. The list items are sorted by count, i.e., the number of occurrences in the attributions and signals of the current resource and its descendents. New list items can be added manually via the textboxes below the lists (5). Manually added items are marked with a star-icon and are displayed at the top of the list (6).

![integration](./docs/user_guide_screenshots/attribution_wizard_doc_add_new.png)

In the second step, a single list with package versions is shown (7). Additionally, each list item displays corresponding package names. The selected package name (from the first wizard step) is highlighted. Also the version list allows adding new items via the textbox below. The selections that have been made can now be saved to the `Attribution Details Column` by clicking `Apply` (8).

![integration](./docs/user_guide_screenshots/attribution_wizard_doc_version.png)

Note that the information in the `Attribution Details Column` is only saved temporarily. To update the attribution, one has to click `Save` or `Confirm` in the bottom right corner of the `Attribution Details Column`.

#### Attribution Details Column

The `Attribution Details Column` is used in the `Audit View` and in the `Attribution View` (see next section) to show
details of the selected attribution and to edit and save the information of the selected attribution. Note that inferred
attribution information and signals cannot be edited.

IMPORTANT: Some fields in the column have special meanings/behaviors:

- _PURL_: If provided, package name and version are extracted from it, and the corresponding fields are not editable. A
  basic validity check is done on the purl: if the purl text is red it means it is invalid and saving is prevented.
- _License Text_: It will appear in the attributions document. It will be automatically filled in for licenses suggested
  in the license name dropdown.
- _Exclude From Notice Checkbox_: If checked, the relative attribution will not be shown in the notice document.
  In the case of first party code, the respective flag should be preferred.
  _Exclude From Notice Checkbox_ should be used only if:
  - the content of the attribution does not need attribution or
  - the attribution isn't an actual attribution or
  - it was globally decided that this attribution does not need attribution (e.g. it is proprietary but bought for the
    whole company).
- _Comment / Comments_: In the case of an ordinary signal or an attribution, the comment textbox is displaying a single comment. In the case of a merged signal, the comment textbox is displaying multiple comments according to the comments of the individual merged signals.
- _Needs Review Checkbox_: This checkbox can be used to signal to another OpossumUI user that an attribution needs further review.
  The state of the checkbox is persisted when saving the attribution, so it can e.g. be used for a typical QA workflow.

The `Attribution Details Column`, if editable, shows the following buttons:

- _SAVE_, saves the edited information for the selected resource only, removing the **pre-selected** attribute if
  present.
- _SAVE GLOBALLY_, (shown only if the attribution of the selected resource is also linked to other resources) saves the
  changes for all the linked resources. The same can also be done by pressing _Ctrl + S_.
- _CONFIRM_, removes the **pre-selected** attribute from the attribution for the selected resource only.
- _CONFIRM GLOBALLY_, (shown only if the attribution of the selected resource is also linked to other resources) removes
  the **pre-selected** attribute from the attribution for all linked resources.
- _..._, opens a menu with the following buttons:
  - _Revert_, discards the changes,
  - _Delete_, deletes the attribution of the selected resource only.
  - _Delete Globally_, (shown only if the attribution of the selected resource is also linked to other resources)
    deletes the attribution for all the linked resources.
- _Mark for replacement_, allows to mark an attribution for replacement. After marking an attribution.
  One can navigate to another attribution and press the _Replace marked_ button. This opens a popup. In the popup,
  clicking the _Replace_ button removes the marked attribution and replaces it by the currently selected one.

The _SAVE_ / _SAVE GLOBALLY_ and _Revert_ buttons are disabled if no change has been made.

When all fields except for the _confidence_ field are empty, pressing the _SAVE_ or the _SAVE GLOBALLY_ button deletes
the respective attribution.

The `Attribution Details Column`, when a signal is selected, shows the _HIDE_ button. It can be used to hide the given
signal in the App for the current input/output files, and it will not have any consequence in the DB. When clicking _HIDE_ for a merged signal, all individual signals that make up the merged signal are hidden.

Instead of the buttons, the context menu can be used to execute all available actions out of _Delete_,
_Delete Globally_, _Confirm_, _Confirm Globally_, _Mark for replacement_, _Hide_ and _Show Resources_. To open the
context menu, right-click a signal or an attribution, e.g. in the `Attributions Sub-Panel`, `Signals Sub-Panel` or
`Attribution List`.

### Attribution View <a name="attribution_view"></a>

![integration](./docs/user_guide_screenshots/attribution_view.png)

In the `Attribution View` all attributions are listed and can be viewed and edited. The page is in structure similar to
the `Audit View` and has two main components:

- an `Attribution List` on the left,
- a `Selected Attribution Panel` on the center right (shown only if an attribution has been selected from the list).

#### Attribution List

All existing attributions are listed and can be selected. **Pre-selected**
attributions are signaled by an `P` icon. They can be confirmed, which converts them into attributions
in all views and in the progress bar. However, that is not a requirement. **Pre-selected** and manual
attributions are both written in the output file. On top there is an icon for opening the filter section. By clicking
on it, a dropdown will be shown with filters that allows for filtering for attributions marked for follow-up, first
party and not first party. The last two are mutually exclusive. Additionally, the attribution view has a multi-select
mode. If at least one attribution has a checked checkbox, the context menu displays the
_Delete selected globally_ and the _Confirm selected globally_ options. The first option deletes all selected
attributions, after confirming the deletions in a pop-up. The second one confirms all selected attributions.

#### Selected Attribution Panel

The `Selected Attribution Panel` looks much like the `Selected Resource Panel`. The main differences are:

- Only information for the **selected attribution** are shown, in a fashion almost identical to
  the `Selected Resource Panel`. They are always editable.
- The _SAVE_ and _Delete_ buttons allow saving/deleting the selected attribution. Note that the changes affect multiple
  resources if the selected attribution is linked to multiple resources.
- A `Resource List` shows the path of all resources linked to the selected attribution. Clicking on a path shows the
  selected resource in the `Audit View`.

### Report View <a name="report_view"></a>

![integration](./docs/user_guide_screenshots/report_view.png)

In the `Report View` all attributions are shown in a table to provide an overview. On top there is a dropdown list with
filters that allows for filtering for attributions marked for follow-up, first party and not first party. The last two
are mutually exclusive.

Clicking on the _edit_ buttons in the _name_ columns, navigates to the respective attribution in the `attribution view`.

### Preferred Attributions <a name="preferred_attributions"></a>

In the audit view, an attributions can be marked as preferred, to indicate that it is preferred over the displayed signals. This feature does not have any immediate effect on the signals displayed in OpossumUI; instead, it is intended to give additional information to tools that consume `.opossum` files. A preferred attribution will store origin IDs of signals visible to the user when it was marked as preferred.

Only signals with a source marked as `isRelevantForPreference` can be preferred over. If no signal source has this flag set, then the feature is disabled.

To mark an attribution as preferred, choose an attribution in the audit view, and open the `...` context menu. From there, you can mark or unmark an attribution as preferred. When an attribution is marked as preferred, `preferred = true` is written to the `.opossum` file, and the origin IDs of all visible signals relevant for preference are written in the field `preferredOverOriginIds`. Preferred attributions are displayed with a star icon.

Note that you are only able to mark an attribution as preferred (or unmark if it was preferred beforehand) if you are in
"QA Mode". To enable this mode click the item "QA Mode" in the `View` submenu.

![disabled_qa_mode](./docs/user_guide_screenshots/disabled_qa_mode.png)

If "QA Mode" is enabled the icon will change as in the screenshot below.

![enabled_qa_mode](./docs/user_guide_screenshots/enabled_qa_mode.png)
