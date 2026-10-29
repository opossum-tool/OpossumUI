// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { Criticality } from '../shared/shared-types';
import { renderApp } from './helpers/render-app';
import {
  expectFormFieldValues,
  fillFormField,
  gotoResource,
  saveChangesInAttributionColumn,
} from './helpers/ui';

test('shows consistent AI status in attribution cards and details', async () => {
  const cases = [
    { id: 'ordinary', aiAttributions: undefined, icons: [], badges: [] },
    {
      id: 'ai-generated',
      aiAttributions: {},
      icons: ['AI generated icon'],
      badges: ['AI generated'],
    },
    {
      id: 'explicitly-unmodified-ai-generated',
      aiAttributions: { humanModified: false, deferred: false },
      icons: ['AI generated icon'],
      badges: ['AI generated'],
    },
    {
      id: 'human-modified',
      aiAttributions: { humanModified: true },
      icons: ['AI generated icon', 'Human-modified AI icon'],
      badges: ['AI generated', 'Human-modified'],
    },
    {
      id: 'deferred',
      aiAttributions: { deferredFields: {} },
      icons: ['Deferred AI icon'],
      badges: ['Deferred'],
    },
    {
      id: 'explicitly-unmodified-deferred',
      aiAttributions: {
        humanModified: false,
        deferredFields: { license: 'Needs review' },
      },
      icons: ['Deferred AI icon'],
      badges: ['Deferred'],
    },
    {
      id: 'both',
      aiAttributions: {
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
        cases.map(({ id, aiAttributions }) => [
          id,
          {
            id,
            comment: id,
            criticality: Criticality.None,
            aiAttributions,
          },
        ]),
      ),
      resourcesToManualAttributions: { '/file.ts': cases.map(({ id }) => id) },
    }),
  });
  await gotoResource('file.ts');
  const panel = screen.getByTestId('attributions-panel');

  for (const { id, icons, badges } of cases) {
    const card = await within(panel).findByLabelText(`package card ${id}`);
    expect(
      within(card)
        .queryAllByLabelText(
          /^(AI generated|Human-modified AI|Deferred AI) icon$/,
        )
        .map((icon) => icon.getAttribute('aria-label')),
    ).toEqual(icons);

    await userEvent.click(within(card).getByText(id));
    await waitFor(() => {
      const details = screen.getByLabelText('attribution column');
      expect(
        within(details)
          .queryAllByTestId(
            /^auditing-option-(ai-generated|human-modified|deferred)$/,
          )
          .map((badge) => badge.textContent),
      ).toEqual(badges);
    });
  }
});

test.each([
  {
    name: 'unmodified AI attribution',
    aiAttributions: { humanModified: false },
    icons: ['AI generated icon'],
    badges: ['AI generated'],
  },
  {
    name: 'deferred AI attribution',
    aiAttributions: {
      humanModified: false,
      deferredFields: { license: 'Needs review' },
    },
    icons: ['Deferred AI icon'],
    badges: ['Deferred'],
  },
  {
    name: 'ordinary attribution',
    aiAttributions: undefined,
    icons: [],
    badges: [],
  },
])(
  'updates card and details after editing an $name',
  async ({ aiAttributions, icons, badges }) => {
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
            aiAttributions,
          },
        },
        resourcesToManualAttributions: { '/file.ts': ['attribution'] },
      }),
    });
    await gotoResource('file.ts');
    const panel = screen.getByTestId('attributions-panel');
    const card = await within(panel).findByLabelText(
      `package card ${initialComment}`,
    );
    await userEvent.click(within(card).getByText(initialComment));

    async function expectStatus(
      comment: string,
      expectedIcons: Array<string>,
      expectedBadges: Array<string>,
    ) {
      await waitFor(() => {
        const currentCard = within(panel).getByLabelText(
          `package card ${comment}`,
        );
        expect(
          within(currentCard)
            .queryAllByLabelText(
              /^(AI generated|Human-modified AI|Deferred AI) icon$/,
            )
            .map((icon) => icon.getAttribute('aria-label')),
        ).toEqual(expectedIcons);
        const details = screen.getByLabelText('attribution column');
        expect(
          within(details)
            .queryAllByTestId(
              /^auditing-option-(ai-generated|human-modified|deferred)$/,
            )
            .map((badge) => badge.textContent),
        ).toEqual(expectedBadges);
      });
      await expectFormFieldValues({ comment });
    }

    await expectStatus(initialComment, icons, badges);
    fillFormField('comment', savedComment);
    await saveChangesInAttributionColumn();

    const savedIcons = aiAttributions
      ? [...icons, 'Human-modified AI icon']
      : icons;
    const savedBadges = aiAttributions ? [...badges, 'Human-modified'] : badges;
    await expectStatus(savedComment, savedIcons, savedBadges);

    await gotoResource('other.ts');
    await gotoResource('file.ts');
    const savedCard = await within(panel).findByLabelText(
      `package card ${savedComment}`,
    );
    await userEvent.click(within(savedCard).getByText(savedComment));
    await expectStatus(savedComment, savedIcons, savedBadges);
  },
);
