// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { AttributionDetails } from '../../e2e-tests/page-objects/AttributionDetails';
import type { AttributionsPanel } from '../../e2e-tests/page-objects/AttributionsPanel';
import type { ResourcesTree } from '../../e2e-tests/page-objects/ResourcesTree';
import type { SignalsPanel } from '../../e2e-tests/page-objects/SignalsPanel';
import type { TopBar } from '../../e2e-tests/page-objects/TopBar';
import type { SyntheticResourceAnchor } from '../synthetic-file/fixture';

export async function prepareResourceSelection({
  anchor,
  resourcesTree,
  assertEditable = true,
}: {
  anchor: SyntheticResourceAnchor;
  resourcesTree: ResourcesTree;
  assertEditable?: boolean;
}): Promise<void> {
  await resourcesTree.revealResource(anchor.resourcePath);
  await Promise.all([
    resourcesTree.assert.resourceAtPathIsVisible(anchor.resourcePath),
    ...(assertEditable
      ? [resourcesTree.assert.resourceAtPathIsEditable(anchor.resourcePath)]
      : []),
  ]);
}

export async function selectResourceAndWaitForAudit({
  anchor,
  attributionDetails,
  attributionsPanel,
  resourcesTree,
  signalsPanel,
}: {
  anchor: SyntheticResourceAnchor;
  attributionDetails: AttributionDetails;
  attributionsPanel: AttributionsPanel;
  resourcesTree: ResourcesTree;
  signalsPanel: SignalsPanel;
}): Promise<void> {
  await resourcesTree.selectRevealedResource(anchor.resourcePath);
  await Promise.all([
    attributionsPanel.assert.loadingIndicatorIsHidden(),
    signalsPanel.assert.loadingIndicatorIsHidden(),
    attributionDetails.assert.loadingIndicatorIsHidden(),
  ]);
}

export async function navigateToResource({
  anchor,
  attributionDetails,
  attributionsPanel,
  resourcesTree,
  signalsPanel,
  assertEditable = true,
}: {
  anchor: SyntheticResourceAnchor;
  attributionDetails: AttributionDetails;
  attributionsPanel: AttributionsPanel;
  resourcesTree: ResourcesTree;
  signalsPanel: SignalsPanel;
  assertEditable?: boolean;
}): Promise<void> {
  await prepareResourceSelection({ anchor, assertEditable, resourcesTree });
  await selectResourceAndWaitForAudit({
    anchor,
    attributionDetails,
    attributionsPanel,
    resourcesTree,
    signalsPanel,
  });
  await resourcesTree.clearSearch();
}

export async function waitForAuditReady({
  attributionDetails,
  attributionsPanel,
  progressBarMode = 'Attributions',
  resourcesTree,
  signalsPanel,
  topBar,
}: {
  attributionDetails: AttributionDetails;
  attributionsPanel: AttributionsPanel;
  progressBarMode?: 'Attributions' | 'Criticalities' | 'Classifications';
  resourcesTree: ResourcesTree;
  signalsPanel: SignalsPanel;
  topBar: TopBar;
}): Promise<void> {
  await Promise.all([
    resourcesTree.assert.isVisible(),
    attributionsPanel.assert.loadingIndicatorIsHidden(),
    signalsPanel.assert.loadingIndicatorIsHidden(),
    attributionDetails.assert.loadingIndicatorIsHidden(),
    topBar.assert.progressBarModeIs(progressBarMode),
  ]);
}

export async function prepareResourceTreeFilter({
  reviewedResource,
  unreviewedResource,
  attributionDetails,
  attributionsPanel,
  resourcesTree,
  signalsPanel,
}: {
  reviewedResource: SyntheticResourceAnchor;
  unreviewedResource: SyntheticResourceAnchor;
  attributionDetails: AttributionDetails;
  attributionsPanel: AttributionsPanel;
  resourcesTree: ResourcesTree;
  signalsPanel: SignalsPanel;
}): Promise<void> {
  await navigateToResource({
    anchor: unreviewedResource,
    attributionDetails,
    attributionsPanel,
    resourcesTree,
    signalsPanel,
  });
  await navigateToResource({
    anchor: reviewedResource,
    attributionDetails,
    attributionsPanel,
    resourcesTree,
    signalsPanel,
  });
  await resourcesTree.gotoRoot();
  await resourcesTree.setUnreviewedFilter(false);
}

export async function applyUnreviewedResourceFilter({
  reviewedResource,
  unreviewedResource,
  resourcesTree,
}: {
  reviewedResource: SyntheticResourceAnchor;
  unreviewedResource: SyntheticResourceAnchor;
  resourcesTree: ResourcesTree;
}): Promise<void> {
  await resourcesTree.setUnreviewedFilter(true);
  await Promise.all([
    resourcesTree.assert.isVisible(),
    resourcesTree.assert.resourceIsVisible(unreviewedResource.resourceName),
    resourcesTree.assert.resourceIsHidden(reviewedResource.resourceName),
  ]);
}

export async function clearUnreviewedResourceFilter({
  reviewedResource,
  attributionDetails,
  attributionsPanel,
  resourcesTree,
  signalsPanel,
}: {
  reviewedResource: SyntheticResourceAnchor;
  attributionDetails: AttributionDetails;
  attributionsPanel: AttributionsPanel;
  resourcesTree: ResourcesTree;
  signalsPanel: SignalsPanel;
}): Promise<void> {
  await resourcesTree.setUnreviewedFilter(false);
  await navigateToResource({
    anchor: reviewedResource,
    attributionDetails,
    attributionsPanel,
    resourcesTree,
    signalsPanel,
  });
  await resourcesTree.gotoRoot();
}
