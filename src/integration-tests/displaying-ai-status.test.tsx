// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { Criticality } from '../shared/shared-types';
import { renderApp } from './helpers/render-app';
import { gotoResource } from './helpers/ui';

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
