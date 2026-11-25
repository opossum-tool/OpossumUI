// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { Criticality } from '../shared/shared-types';
import { renderApp } from '../testing/render-app';
import {
  ATTRIBUTIONS_PANEL,
  clickPackageCardByLabel,
  expectAiStatusBadges,
  expectFormFieldValues,
  expectPackageCardAiIcons,
  fillFormField,
  gotoResource,
  saveChangesInAttributionColumn,
} from '../testing/ui';

test('shows consistent AI status in attribution cards and details', async () => {
  const cases = [
    { id: 'ordinary', aiAttributes: undefined, icons: [], badges: [] },
    {
      id: 'ai-generated',
      aiAttributes: {},
      icons: ['AI generated icon'],
      badges: ['AI generated'],
    },
    {
      id: 'explicitly-unmodified-ai-generated',
      aiAttributes: { humanModified: false, deferred: false },
      icons: ['AI generated icon'],
      badges: ['AI generated'],
    },
    {
      id: 'human-modified',
      aiAttributes: { humanModified: true },
      icons: ['AI generated icon', 'Human-modified AI icon'],
      badges: ['AI generated', 'Human-modified'],
    },
    {
      id: 'deferred',
      aiAttributes: { deferredFields: {} },
      icons: ['Deferred AI icon'],
      badges: ['Deferred'],
    },
    {
      id: 'explicitly-unmodified-deferred',
      aiAttributes: {
        humanModified: false,
        deferredFields: { license: 'Needs review' },
      },
      icons: ['Deferred AI icon'],
      badges: ['Deferred'],
    },
    {
      id: 'both',
      aiAttributes: {
        humanModified: true,
        deferredFields: { license: 'Needs review' },
      },
      icons: ['Deferred AI icon', 'Human-modified AI icon'],
      badges: ['Deferred', 'Human-modified'],
    },
  ];
  await renderApp({
    data: getParsedInputFileEnrichedWithTestData({
      resources: { 'file.ts': 1 },
      manualAttributions: Object.fromEntries(
        cases.map(({ id, aiAttributes }) => [
          id,
          {
            id,
            comment: id,
            criticality: Criticality.None,
            aiAttributes,
          },
        ]),
      ),
      resourcesToManualAttributions: { '/file.ts': cases.map(({ id }) => id) },
    }),
  });
  await gotoResource('file.ts');

  for (const { id, icons, badges } of cases) {
    await expectPackageCardAiIcons(ATTRIBUTIONS_PANEL, id, icons);
    await clickPackageCardByLabel(ATTRIBUTIONS_PANEL, id);
    await expectAiStatusBadges(badges);
  }
});

test.each([
  {
    name: 'unmodified AI attribution',
    aiAttributes: { humanModified: false },
    icons: ['AI generated icon'],
    badges: ['AI generated'],
  },
  {
    name: 'deferred AI attribution',
    aiAttributes: {
      humanModified: false,
      deferredFields: { license: 'Needs review' },
    },
    icons: ['Deferred AI icon'],
    badges: ['Deferred'],
  },
  {
    name: 'ordinary attribution',
    aiAttributes: undefined,
    icons: [],
    badges: [],
  },
])(
  'updates card and details after editing an $name',
  async ({ aiAttributes, icons, badges }) => {
    const initialComment = 'Original comment';
    const savedComment = 'Edited comment';
    await renderApp({
      data: getParsedInputFileEnrichedWithTestData({
        resources: { 'file.ts': 1, 'other.ts': 1 },
        manualAttributions: {
          attribution: {
            id: 'attribution',
            comment: initialComment,
            criticality: Criticality.None,
            aiAttributes,
          },
        },
        resourcesToManualAttributions: { '/file.ts': ['attribution'] },
      }),
    });
    await gotoResource('file.ts');

    async function expectStatus(
      comment: string,
      expectedIcons: Array<string>,
      expectedBadges: Array<string>,
    ) {
      await expectPackageCardAiIcons(
        ATTRIBUTIONS_PANEL,
        comment,
        expectedIcons,
      );
      await expectAiStatusBadges(expectedBadges);
      await expectFormFieldValues({ comment });
    }

    await clickPackageCardByLabel(ATTRIBUTIONS_PANEL, initialComment);
    await expectStatus(initialComment, icons, badges);
    fillFormField('comment', savedComment);
    await saveChangesInAttributionColumn();

    const savedIcons = aiAttributes
      ? [...icons, 'Human-modified AI icon']
      : icons;
    const savedBadges = aiAttributes ? [...badges, 'Human-modified'] : badges;
    await expectStatus(savedComment, savedIcons, savedBadges);

    await gotoResource('other.ts');
    await gotoResource('file.ts');
    await clickPackageCardByLabel(ATTRIBUTIONS_PANEL, savedComment);
    await expectStatus(savedComment, savedIcons, savedBadges);
  },
);
