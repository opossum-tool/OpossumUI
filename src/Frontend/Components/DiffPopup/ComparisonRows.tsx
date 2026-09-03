// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MuiBox from '@mui/material/Box';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { Fragment } from 'react';

import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { generatePurl } from '../../util/handle-purl';
import {
  type PackageFieldDefaults,
  PurlField,
} from '../AttributionForm/PackageSubPanel/PackageFields';
import { ComparisonFieldEditor } from './ComparisonFieldEditor';
import { diffPopupStyles } from './DiffPopup.style';
import {
  canTransfer,
  type ComparisonItem,
  type FieldDefinition,
  type FormAttribute,
  isEditable,
  isFieldVisible,
  type Side,
  type UpdateField,
  valueForComparison,
} from './DiffPopup.util';

interface ComparisonRenderProps {
  left: ComparisonItem;
  right: ComparisonItem;
  drafts: Record<Side, PackageInfo>;
  isBusy: boolean;
  onChange: UpdateField;
  onUndo: (side: Side, key: FormAttribute) => void;
  showLicenseText: boolean;
  onToggleLicenseText: () => void;
  packageDefaults: Record<Side, PackageFieldDefaults>;
}

interface ComparisonRowsProps extends ComparisonRenderProps {
  fields: Array<FieldDefinition>;
  onCopy: (source: Side, destination: Side, key: FormAttribute) => void;
}

interface ComparisonFieldProps extends ComparisonRenderProps {
  field: FieldDefinition;
  onCopy: (source: Side, destination: Side, key: FormAttribute) => void;
}

export function ComparisonRows({
  fields,
  left,
  right,
  drafts,
  isBusy,
  onChange,
  onCopy,
  onUndo,
  showLicenseText,
  onToggleLicenseText,
  packageDefaults,
}: ComparisonRowsProps) {
  return (
    <MuiBox sx={diffPopupStyles.comparisonRows}>
      {fields
        .filter(({ key }) => showLicenseText || key !== 'licenseText')
        .map((field) => (
          <ComparisonFieldRow
            key={field.key}
            field={field}
            left={left}
            right={right}
            drafts={drafts}
            isBusy={isBusy}
            onChange={onChange}
            onCopy={onCopy}
            onUndo={onUndo}
            showLicenseText={showLicenseText}
            onToggleLicenseText={onToggleLicenseText}
            packageDefaults={packageDefaults}
          />
        ))}
    </MuiBox>
  );
}

export function IndependentComparisonColumns({
  fields,
  left,
  right,
  drafts,
  isBusy,
  onChange,
  onUndo,
  showLicenseText,
  onToggleLicenseText,
  packageDefaults,
}: ComparisonRenderProps & { fields: Array<FieldDefinition> }) {
  const sides = [
    { side: 'left' as const, item: left, draft: drafts.left },
    { side: 'right' as const, item: right, draft: drafts.right },
  ];
  return (
    <MuiBox sx={diffPopupStyles.independentColumns}>
      {sides.map(({ side, item, draft }, index) => (
        <Fragment key={side}>
          <MuiBox sx={diffPopupStyles.independentColumn}>
            {fields
              .filter(({ key }) => showLicenseText || key !== 'licenseText')
              .map((field) =>
                isFieldVisible(field.key, draft) ? (
                  <ComparisonFieldEditor
                    key={field.key}
                    side={side}
                    item={item}
                    field={field}
                    draft={draft}
                    openingPackageInfo={item.packageInfo}
                    isBusy={isBusy}
                    onChange={onChange}
                    onUndo={onUndo}
                    showLicenseText={showLicenseText}
                    onToggleLicenseText={onToggleLicenseText}
                    packageDefaults={packageDefaults}
                  />
                ) : null,
              )}
          </MuiBox>
          {index === 0 && <MuiBox sx={diffPopupStyles.comparisonCell} />}
        </Fragment>
      ))}
    </MuiBox>
  );
}

function ComparisonFieldRow({
  field,
  left,
  right,
  drafts,
  isBusy,
  onChange,
  onCopy,
  onUndo,
  showLicenseText,
  onToggleLicenseText,
  packageDefaults,
}: ComparisonFieldProps) {
  const leftFieldVisible = isFieldVisible(field.key, drafts.left);
  const rightFieldVisible = isFieldVisible(field.key, drafts.right);
  if (!leftFieldVisible && !rightFieldVisible) {
    return null;
  }
  const leftValue = drafts.left[field.key];
  const rightValue = drafts.right[field.key];
  const valuesDiffer =
    leftFieldVisible &&
    rightFieldVisible &&
    valueForComparison(field.key, leftValue) !==
      valueForComparison(field.key, rightValue);

  const leftTransferVisible = canTransfer(
    'right',
    'left',
    field.key,
    drafts,
    { left, right },
    isBusy,
  );
  const rightTransferVisible = canTransfer(
    'left',
    'right',
    field.key,
    drafts,
    { left, right },
    isBusy,
  );

  return (
    <MuiBox
      sx={diffPopupStyles.comparisonRow}
      data-testid={`comparison-row-${field.key}`}
    >
      <MuiBox
        sx={diffPopupStyles.comparisonCell}
        data-testid={`comparison-row-${field.key}-left`}
      >
        {leftFieldVisible && (
          <ComparisonFieldEditor
            side={'left'}
            item={left}
            field={field}
            draft={drafts.left}
            openingPackageInfo={left.packageInfo}
            isBusy={isBusy}
            different={valuesDiffer}
            onChange={onChange}
            onUndo={onUndo}
            showLicenseText={showLicenseText}
            onToggleLicenseText={onToggleLicenseText}
            packageDefaults={packageDefaults}
          />
        )}
      </MuiBox>
      <MuiBox
        sx={diffPopupStyles.comparisonActionCell}
        data-testid={`comparison-row-${field.key}-action`}
        data-different={valuesDiffer ? 'true' : 'false'}
      >
        {(leftTransferVisible || rightTransferVisible) && (
          <MuiBox sx={diffPopupStyles.transferControls}>
            {leftTransferVisible && (
              <TransferButton
                direction={'right-to-left'}
                placement={'top'}
                field={field}
                onCopy={() => onCopy('right', 'left', field.key)}
              />
            )}
            {rightTransferVisible && (
              <TransferButton
                direction={'left-to-right'}
                placement={leftTransferVisible ? 'bottom' : 'top'}
                field={field}
                onCopy={() => onCopy('left', 'right', field.key)}
              />
            )}
          </MuiBox>
        )}
      </MuiBox>
      <MuiBox
        sx={diffPopupStyles.comparisonCell}
        data-testid={`comparison-row-${field.key}-right`}
      >
        {rightFieldVisible && (
          <ComparisonFieldEditor
            side={'right'}
            item={right}
            field={field}
            draft={drafts.right}
            openingPackageInfo={right.packageInfo}
            isBusy={isBusy}
            different={valuesDiffer}
            onChange={onChange}
            onUndo={onUndo}
            showLicenseText={showLicenseText}
            onToggleLicenseText={onToggleLicenseText}
            packageDefaults={packageDefaults}
          />
        )}
      </MuiBox>
    </MuiBox>
  );
}

function TransferButton({
  direction,
  placement,
  field,
  onCopy,
}: {
  direction: 'right-to-left' | 'left-to-right';
  placement: 'top' | 'bottom';
  field: FieldDefinition;
  onCopy: () => void;
}) {
  const arrowLabel =
    direction === 'right-to-left'
      ? text.diffPopup.copyRightToLeft
      : text.diffPopup.copyLeftToRight;
  return (
    <MuiTooltip
      title={arrowLabel}
      placement={placement}
      disableInteractive={true}
      enterDelay={1000}
    >
      <span>
        <MuiIconButton
          size={'small'}
          sx={diffPopupStyles.transferButton}
          aria-label={`${arrowLabel}: ${field.label}`}
          onClick={onCopy}
        >
          {direction === 'right-to-left' ? (
            <ArrowBackIcon fontSize={'small'} />
          ) : (
            <ArrowForwardIcon fontSize={'small'} />
          )}
        </MuiIconButton>
      </span>
    </MuiTooltip>
  );
}

export function DerivedPurlRow({
  drafts,
  items,
  isBusy,
  onChange,
}: {
  drafts: Record<Side, PackageInfo>;
  items: Record<Side, ComparisonItem>;
  isBusy: boolean;
  onChange: UpdateField;
}) {
  const leftPurl = generatePurl(drafts.left) || text.diffPopup.emptyPurl;
  const rightPurl = generatePurl(drafts.right) || text.diffPopup.emptyPurl;
  const isDifferent = leftPurl !== rightPurl;
  return (
    <MuiBox
      sx={diffPopupStyles.comparisonRow}
      data-testid={'comparison-row-purl'}
    >
      <MuiBox sx={diffPopupStyles.comparisonCell}>
        <PurlField
          packageInfo={drafts.left}
          onUpdate={(patch) => onChange('left', patch)}
          readOnly={!isEditable(items.left)}
          disabled={isBusy}
          sx={isDifferent ? diffPopupStyles.differenceField : undefined}
        />
      </MuiBox>
      <MuiBox
        sx={diffPopupStyles.comparisonActionCell}
        data-testid={'comparison-row-purl-action'}
        data-different={isDifferent ? 'true' : 'false'}
      />
      <MuiBox sx={diffPopupStyles.comparisonCell}>
        <PurlField
          packageInfo={drafts.right}
          onUpdate={(patch) => onChange('right', patch)}
          readOnly={!isEditable(items.right)}
          disabled={isBusy}
          sx={isDifferent ? diffPopupStyles.differenceField : undefined}
        />
      </MuiBox>
    </MuiBox>
  );
}
