// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'vitest';

import { getSaveFileArgs } from '../../ElectronBackend/api/getSaveFileArgs';
import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import type { RawPackageInfo } from '../../shared/shared-types';
import { text } from '../../shared/text';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  clickAttributionColumnButton,
  clickDiffPopupButton,
  clickPackageCard,
  clickPopupButton,
  expectDiffPopupPackageName,
  expectDiffPopupVisibility,
  expectFormFieldValues,
  expectPopupHidden,
  expectResourceVisibility,
  fillDiffPopupField,
  fillFormField,
  gotoResource,
} from './helpers/ui';

const ATTRIBUTIONS_PANEL = 'attributions-panel';
const LINKED_RESOURCES_TREE = 'linked-resources-tree';

const LEFT_RESOURCE_PATH = '/writable/left.ts';
const RIGHT_RESOURCE_PATH = '/writable/right.ts';

const leftAttributionId = 'left-attribution';
const rightAttributionId = 'right-attribution';
const leftPackageInfoBase: RawPackageInfo = { packageName: 'foo' };
const rightPackageInfoBase: RawPackageInfo = { packageName: 'bar' };

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    writable: { 'left.ts': 1, 'right.ts': 1 },
  }),
  manualAttributions: deserializeAttributions(
    {
      [leftAttributionId]: leftPackageInfoBase,
      [rightAttributionId]: rightPackageInfoBase,
    },
    {},
  ),
  resourcesToManualAttributions: {
    [LEFT_RESOURCE_PATH]: [leftAttributionId],
    [RIGHT_RESOURCE_PATH]: [rightAttributionId],
  },
});

const mixedData = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    writable: { 'left.ts': 1, 'right.ts': 1 },
    readonly: { 'right.ts': 1 },
  }),
  manualAttributions: deserializeAttributions(
    {
      [leftAttributionId]: leftPackageInfoBase,
      [rightAttributionId]: { ...rightPackageInfoBase, packageName: 'bar' },
    },
    {},
  ),
  resourcesToManualAttributions: {
    [LEFT_RESOURCE_PATH]: [leftAttributionId],
    [RIGHT_RESOURCE_PATH]: [rightAttributionId],
    '/readonly/right.ts': [rightAttributionId],
  },
  readonlyRules: [{ path: '/readonly', readonly: true }],
});

async function openComparison(): Promise<void> {
  await gotoResource('writable', 'left.ts');
  await clickPackageCard(ATTRIBUTIONS_PANEL, leftPackageInfoBase);
  await expectFormFieldValues({ name: 'foo' });
  await clickAttributionColumnButton('compare-with');
  await gotoResource('writable', 'right.ts');
  await clickPackageCard(ATTRIBUTIONS_PANEL, rightPackageInfoBase);
  await clickAttributionColumnButton('compare-confirm');
  await expectDiffPopupVisibility(true);
}

describe('comparison save behavior', () => {
  it('swaps two attribution values while preserving resource associations', async () => {
    await renderApp({ data });
    await openComparison();

    fillDiffPopupField('left', 'packageName', 'bar');
    fillDiffPopupField('right', 'packageName', 'foo');
    await clickDiffPopupButton('save');
    await clickPopupButton(
      text.saveAttributionsPopup.ariaLabel,
      text.saveAttributionsPopup.saveGlobally,
    );
    await expectPopupHidden(text.saveAttributionsPopup.ariaLabel);
    await expectDiffPopupVisibility(false);
    await expectFormFieldValues({ name: 'foo' });

    const { result } = await getSaveFileArgs();
    expect(result.manualAttributions[leftAttributionId]?.packageName).toBe(
      'bar',
    );
    expect(result.manualAttributions[rightAttributionId]?.packageName).toBe(
      'foo',
    );
    expect(result.resourcesToAttributions[LEFT_RESOURCE_PATH]).toEqual([
      leftAttributionId,
    ]);
    expect(result.resourcesToAttributions[RIGHT_RESOURCE_PATH]).toEqual([
      rightAttributionId,
    ]);
    expect(Object.keys(result.manualAttributions)).toHaveLength(2);
  });

  it('merges matching drafts and keeps editing the survivor', async () => {
    await renderApp({ data });
    await openComparison();

    fillDiffPopupField('left', 'packageName', 'merged');
    fillDiffPopupField('right', 'packageName', 'merged');
    await clickDiffPopupButton('save');
    await clickPopupButton(
      text.saveAttributionsPopup.ariaLabel,
      text.saveAttributionsPopup.saveGlobally,
    );
    await expectPopupHidden(text.saveAttributionsPopup.ariaLabel);
    await expectDiffPopupVisibility(false);
    await expectFormFieldValues({ name: 'merged' });
    await expectResourceVisibility(
      ['left.ts', 'right.ts'],
      [],
      LINKED_RESOURCES_TREE,
    );

    fillFormField('name', 'merged-again');
    await clickAttributionColumnButton('save');
    await clickPopupButton(
      text.saveAttributionsPopup.ariaLabel,
      text.saveAttributionsPopup.saveGlobally,
    );
    await expectPopupHidden(text.saveAttributionsPopup.ariaLabel);
    await expectFormFieldValues({ name: 'merged-again' });

    const { result } = await getSaveFileArgs();
    const attributionIds = Object.keys(result.manualAttributions);
    expect(attributionIds).toHaveLength(1);
    const [survivorId] = attributionIds;
    expect(result.manualAttributions[survivorId]?.packageName).toBe(
      'merged-again',
    );
    expect(result.resourcesToAttributions[LEFT_RESOURCE_PATH]).toEqual([
      survivorId,
    ]);
    expect(result.resourcesToAttributions[RIGHT_RESOURCE_PATH]).toEqual([
      survivorId,
    ]);

    await gotoResource('writable', 'left.ts');
    await expectFormFieldValues({ name: 'merged-again' });
    await gotoResource('writable', 'right.ts');
    await expectFormFieldValues({ name: 'merged-again' });
  });

  it('keeps both drafts when save confirmation is cancelled and persists the reopened save', async () => {
    await renderApp({ data });
    await openComparison();

    fillDiffPopupField('left', 'packageName', 'cancelled-left-edit');
    fillDiffPopupField('right', 'packageName', 'cancelled-right-edit');
    await clickDiffPopupButton('save');
    await clickPopupButton(
      text.saveAttributionsPopup.ariaLabel,
      text.buttons.cancel,
    );
    await expectPopupHidden(text.saveAttributionsPopup.ariaLabel);
    await expectDiffPopupVisibility(true);
    await expectDiffPopupPackageName('left', 'cancelled-left-edit');
    await expectDiffPopupPackageName('right', 'cancelled-right-edit');

    fillDiffPopupField('left', 'packageName', 'final-left-edit');
    fillDiffPopupField('right', 'packageName', 'final-right-edit');
    await clickDiffPopupButton('save');
    await clickPopupButton(
      text.saveAttributionsPopup.ariaLabel,
      text.saveAttributionsPopup.saveGlobally,
    );
    await expectPopupHidden(text.saveAttributionsPopup.ariaLabel);
    await expectDiffPopupVisibility(false);

    await expectFormFieldValues({ name: 'final-right-edit' });

    const { result } = await getSaveFileArgs();
    expect(result.manualAttributions[leftAttributionId]?.packageName).toBe(
      'final-left-edit',
    );
    expect(result.manualAttributions[rightAttributionId]?.packageName).toBe(
      'final-right-edit',
    );
  });

  it('partitions a mixed readonly attribution when saving its edited value', async () => {
    const editedName = 'mixed-edit';

    await renderApp({ data: mixedData });
    await openComparison();

    fillDiffPopupField('right', 'packageName', editedName);
    await clickDiffPopupButton('save');
    await clickPopupButton(
      text.saveAttributionsPopup.ariaLabel,
      text.saveAttributionsPopup.save,
    );
    await expectPopupHidden(text.saveAttributionsPopup.ariaLabel);
    await expectDiffPopupVisibility(false);
    await expectFormFieldValues({ name: editedName });

    const { result } = await getSaveFileArgs();
    const writableAttributionId =
      result.resourcesToAttributions[RIGHT_RESOURCE_PATH]?.[0];
    expect(writableAttributionId).toBeDefined();
    expect(writableAttributionId).not.toBe(rightAttributionId);
    expect(result.manualAttributions[rightAttributionId]?.packageName).toBe(
      'bar',
    );
    expect(result.manualAttributions[writableAttributionId]?.packageName).toBe(
      editedName,
    );
    expect(result.resourcesToAttributions['/readonly/right.ts']).toEqual([
      rightAttributionId,
    ]);
    expect(result.resourcesToAttributions[LEFT_RESOURCE_PATH]).toEqual([
      leftAttributionId,
    ]);
    expect(result.manualAttributions[leftAttributionId]?.packageName).toBe(
      'foo',
    );
  });
});
