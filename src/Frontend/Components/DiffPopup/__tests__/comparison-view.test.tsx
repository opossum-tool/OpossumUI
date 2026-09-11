// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { Criticality, type PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { theme } from '../../App/App.style';
import type { AuditingOptions } from '../../AttributionForm/AuditingOptions/AuditingOptions';
import type { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import type { ComparisonFieldEditor } from '../ComparisonFieldEditor';
import { ComparisonView } from '../ComparisonView';
import type { ComparisonItem } from '../DiffPopup';
import { useComparisonState } from '../use-comparison-state';

type AuditingOptionsProps = ComponentProps<typeof AuditingOptions>;
type ComparisonFieldEditorProps = ComponentProps<typeof ComparisonFieldEditor>;
const confirm: Confirm = (onConfirm) => {
  void onConfirm();
  return Promise.resolve(true);
};

vi.mock('../../AttributionForm/AuditingOptions/AuditingOptions', () => ({
  AuditingOptions: ({
    packageInfo,
    isEditable,
    onUpdate,
  }: AuditingOptionsProps) => (
    <>
      <button
        data-testid={'auditing-add-follow-up'}
        disabled={!isEditable || packageInfo.followUp === true}
        onClick={() => onUpdate({ followUp: true })}
        type={'button'}
      >
        add follow-up
      </button>
      {packageInfo.followUp === true && (
        <span data-testid={'auditing-option-follow-up'}>follow-up</span>
      )}
      <output data-testid={'auditing-confidence'}>
        {packageInfo.attributionConfidence}
      </output>
      <button
        data-testid={'auditing-change-confidence'}
        disabled={!isEditable}
        onClick={() => onUpdate({ attributionConfidence: 80 })}
        type={'button'}
      >
        change confidence
      </button>
    </>
  ),
}));

vi.mock('../../AttributionForm/PackageSubPanel/PackageFields', () => ({
  PurlField: () => <div data-testid={'purl-field'} />,
  usePackageFieldDefaults: () => ({}),
}));

vi.mock('../ComparisonFieldEditor', () => ({
  ComparisonFieldEditor: ({
    side,
    field,
    draft,
    onChange,
    onToggleLicenseText,
    showLicenseText,
  }: ComparisonFieldEditorProps) => (
    <>
      {field.key === 'licenseName' && (
        <button
          aria-expanded={showLicenseText}
          aria-label={'license-text-toggle-button'}
          onClick={onToggleLicenseText}
          type={'button'}
        >
          toggle license text
        </button>
      )}
      <input
        data-testid={`${side}-${field.key}`}
        onChange={(event) =>
          onChange(side, { [field.key]: event.target.value })
        }
        value={String(draft[field.key] ?? '')}
      />
    </>
  ),
}));

function packageInfo(overrides: Partial<PackageInfo> = {}): PackageInfo {
  return {
    id: 'package',
    attributionConfidence: 50,
    criticality: Criticality.None,
    packageName: 'react',
    packageType: 'npm',
    licenseName: 'MIT',
    licenseText: 'MIT License',
    comment: 'opening comment',
    ...overrides,
  };
}

function item(
  side: 'left' | 'right',
  overrides: Partial<ComparisonItem> = {},
): ComparisonItem {
  return {
    isExternal: side === 'left',
    label: side,
    packageInfo: packageInfo({ id: side }),
    ...overrides,
  };
}

function ComparisonHarness({
  leftItem,
  rightItem,
}: {
  leftItem: ComparisonItem;
  rightItem: ComparisonItem;
}) {
  const comparison = useComparisonState(leftItem, rightItem, false);
  return (
    <ComparisonView
      {...comparison}
      isBusy={false}
      editConfirmations={{ left: confirm, right: confirm }}
    />
  );
}

function renderComparison(
  leftItem: ComparisonItem = item('left'),
  rightItem: ComparisonItem = item('right'),
) {
  return render(
    <ThemeProvider theme={theme}>
      <ComparisonHarness leftItem={leftItem} rightItem={rightItem} />
    </ThemeProvider>,
  );
}

describe('ComparisonView', () => {
  it('starts license text hidden and toggles both sides together', async () => {
    const user = userEvent.setup();
    renderComparison();

    expect(
      screen.queryByTestId('comparison-row-licenseText'),
    ).not.toBeInTheDocument();
    await user.click(screen.getAllByLabelText('license-text-toggle-button')[0]);

    expect(screen.getByTestId('left-licenseText')).toHaveValue('MIT License');
    expect(screen.getByTestId('right-licenseText')).toHaveValue('MIT License');
    await user.click(screen.getAllByLabelText('license-text-toggle-button')[1]);
    expect(
      screen.queryByTestId('comparison-row-licenseText'),
    ).not.toBeInTheDocument();
  });

  it('preserves a license-text edit across collapse and expansion', async () => {
    const user = userEvent.setup();
    renderComparison();

    await user.click(screen.getAllByLabelText('license-text-toggle-button')[0]);
    await user.clear(screen.getByTestId('right-licenseText'));
    await user.type(screen.getByTestId('right-licenseText'), 'edited license');
    await user.click(screen.getAllByLabelText('license-text-toggle-button')[1]);
    await user.click(screen.getAllByLabelText('license-text-toggle-button')[0]);

    expect(screen.getByTestId('right-licenseText')).toHaveValue(
      'edited license',
    );
  });

  it('resets license-text visibility after the comparison view is remounted', async () => {
    const user = userEvent.setup();
    function Session({ open }: { open: boolean }) {
      return open ? (
        <ComparisonHarness leftItem={item('left')} rightItem={item('right')} />
      ) : null;
    }
    const view = render(
      <ThemeProvider theme={theme}>
        <Session open={true} />
      </ThemeProvider>,
    );

    await user.click(screen.getAllByLabelText('license-text-toggle-button')[0]);
    expect(
      screen.getByTestId('comparison-row-licenseText'),
    ).toBeInTheDocument();
    view.rerender(
      <ThemeProvider theme={theme}>
        <Session open={false} />
      </ThemeProvider>,
    );
    view.rerender(
      <ThemeProvider theme={theme}>
        <Session open={true} />
      </ThemeProvider>,
    );

    expect(
      screen.queryByTestId('comparison-row-licenseText'),
    ).not.toBeInTheDocument();
  });

  it('undoes auditing changes for one side while preserving its field edit', async () => {
    const user = userEvent.setup();
    renderComparison();

    await user.click(
      within(screen.getByTestId('right-auditing-options')).getByTestId(
        'auditing-add-follow-up',
      ),
    );
    await user.click(
      within(screen.getByTestId('right-auditing-options')).getByTestId(
        'auditing-change-confidence',
      ),
    );
    expect(
      within(screen.getByTestId('right-auditing-options')).getByTestId(
        'auditing-confidence',
      ),
    ).toHaveTextContent('80');
    await user.clear(screen.getByTestId('right-packageName'));
    await user.type(screen.getByTestId('right-packageName'), 'edited package');

    expect(
      within(screen.getByTestId('left-auditing-options')).queryByTestId(
        'auditing-option-follow-up',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('right-auditing-options')).getByTestId(
        'auditing-option-follow-up',
      ),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: text.diffPopup.undoAuditingChanges('right'),
      }),
    );

    expect(
      within(screen.getByTestId('right-auditing-options')).queryByTestId(
        'auditing-option-follow-up',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('right-auditing-options')).getByTestId(
        'auditing-confidence',
      ),
    ).toHaveTextContent('50');
    expect(screen.getByTestId('right-packageName')).toHaveValue(
      'edited package',
    );
  });
});
