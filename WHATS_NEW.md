<!--
SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>

SPDX-License-Identifier: CC0-1.0
-->

<!--
Users who have seen a lower revision are shown these notes on their next start.
When adding notes for the first new feature after a release, increment the revision
and delete the previous notes and screenshots.
-->
<!-- whats-new-revision: 2 -->

## Quickfilters: save and reuse your filters

The filter menus for attributions, signals, and the resources tree now include
a **Quickfilters** section. Any combination of filters — including the search
field — can be saved under a name and reapplied with one click, so you do not
have to set up the same filters each time you start a review.

Set up the filters you want, open the filter menu, and choose **Save current
filters…**. Give your quickfilter a name, and it is saved and applied right
away, marked with a bookmark. Quickfilters are part of your personal user
settings, so they stay available across sessions and projects.

![Filter menu with the Quickfilters submenu open and Save current filters… highlighted](docs/whats_new_screenshots/safe-flow.png 'Save the selected filters as a quickfilter.')

## Apply, combine, and override

Click a quickfilter to apply it and click it again to remove it. You can apply
several quickfilters at once, and they combine where they fit together.
Applying a quickfilter that clashes with an active one still works: a warning
icon explains which filters it will replace, and applying overwrites those
conflicting filters.

Filters remain fully editable while quickfilters are active. Add filters
manually on top of an applied quickfilter — and **Clear all** in the
quickfilters menu removes only the quickfilters' own conditions while keeping
the filters you set by hand.

![Quickfilters panel with two quickfilters applied](docs/whats_new_screenshots/active-combined-state.png 'Apply several quickfilters together.')

![Conflicting quickfilter with a warning icon and a tooltip explaining that applying it replaces the filters of another quickfilter](docs/whats_new_screenshots/conflict-warning.png 'Applying a conflicting quickfilter replaces the clashing filters.')

## One set of quickfilters, all panels

Quickfilters saved on one panel are also offered on the others wherever they
make sense. A quickfilter based only on licenses works everywhere: on the
attributions panel, the signals panel, and the resources tree. Conditions that
only exist on one panel, such as 'only unreviewed files' for resources or a
search term for attributions, keep the quickfilter on its own panel. A
quickfilter that needs a classification missing in the current project, or one
that uses criticality or classification while those are hidden, is shown
disabled. Deleting a quickfilter deselects it on every panel where it was
active.

## Manage your quickfilters

Open the pencil icon in the quickfilters menu to rename, delete, and reorder
quickfilters by dragging them into the order that suits your workflow.

![Quickfilters edit mode with drag handles, rename, and delete controls](docs/whats_new_screenshots/edit-mode.png 'Rename, delete, and reorder quickfilters.')
