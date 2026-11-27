// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { renderComponent } from '../../../test-helpers/render';
import { AiReviewAttributionFormBody } from '../ai-review-attribution-form-body';

describe('AiReviewAttributionFormBody', () => {
  it('renders package fields in order with neutral metadata', async () => {
    const packageInfo = faker.opossum.packageInfo({
      packageName: 'A package',
      packageNamespace: 'a namespace',
      packageVersion: '2.0',
      packageType: 'npm',
      url: 'https://example.org/repository',
      comment: 'Reviewed from the manifest.',
    });
    await renderComponent(
      <AiReviewAttributionFormBody
        packageInfo={packageInfo}
        onUpdate={vi.fn()}
      />,
    );

    const table = within(screen.getByRole('table', { name: 'package fields' }));
    const rows = table.getAllByRole('row').slice(1);
    expect(
      rows.map((row) => within(row).getAllByRole('cell')[2].textContent),
    ).toEqual([
      text.attributionColumn.packageName,
      text.attributionColumn.packageNamespace,
      text.attributionColumn.packageVersion,
      text.attributionColumn.packageType,
      'Repository URL',
    ]);
    expect(
      rows.map((row) => within(row).getAllByRole('cell')[3].textContent),
    ).toEqual([
      'A package',
      'a namespace',
      '2.0',
      'npm',
      'https://example.org/repository',
    ]);
    expect(
      rows.map((row) => within(row).getAllByRole('cell')[1].textContent),
    ).toEqual(['—', '—', '—', '—', '—']);
    expect(screen.getByText('Reviewed from the manifest.')).toBeVisible();
    expect(
      screen.queryByRole('textbox', { name: 'Comment' }),
    ).not.toBeInTheDocument();
  });

  it('expands by keyboard and mouse, preserves multiline values, and hides first-party legal fields', async () => {
    const copyright = 'Copyright line one\nCopyright line two';
    const packageInfo = faker.opossum.packageInfo({
      firstParty: false,
      copyright,
      licenseName: 'MIT',
    });
    const { rerender } = await renderComponent(
      <AiReviewAttributionFormBody
        packageInfo={packageInfo}
        onUpdate={vi.fn()}
      />,
    );

    const legalTable = within(
      screen.getByRole('table', { name: 'legal fields' }),
    );
    expect(legalTable.getByText('Attribution type')).toBeVisible();
    expect(legalTable.getByText(text.diffPopup.copyright)).toBeVisible();
    expect(
      legalTable.getByText(text.attributionColumn.licenseExpression),
    ).toBeVisible();
    const expandButton = screen.getByRole('button', {
      name: 'Expand Copyright',
    });
    expandButton.focus();
    await userEvent.keyboard('{Enter}');
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByText(/Copyright line one/)).toHaveLength(2);
    expect(screen.getAllByText(/Copyright line one/)[1].textContent).toBe(
      copyright,
    );
    const licenseExpandButton = screen.getByRole('button', {
      name: `Expand ${text.attributionColumn.licenseExpression}`,
    });
    await userEvent.click(licenseExpandButton);
    expect(licenseExpandButton).toHaveAttribute('aria-expanded', 'true');

    rerender(
      <AiReviewAttributionFormBody
        packageInfo={{
          ...packageInfo,
          id: faker.string.uuid(),
          firstParty: true,
        }}
        onUpdate={vi.fn()}
      />,
    );
    expect(
      screen.queryByText(text.diffPopup.copyright),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(text.attributionColumn.licenseExpression),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Attribution type')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Expand Attribution type' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });
});
