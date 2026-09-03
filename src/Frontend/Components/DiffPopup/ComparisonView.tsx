// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import UndoIcon from '@mui/icons-material/Undo';
import MuiBox from '@mui/material/Box';
import MuiDivider from '@mui/material/Divider';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import MuiTypography from '@mui/material/Typography';
import { type ReactNode, useState } from 'react';

import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { AuditingOptions } from '../AttributionForm/AuditingOptions/AuditingOptions';
import { AUDITING_PROPERTY_NAMES } from '../AttributionForm/AuditingOptions/AuditingOptions.types';
import {
  type PackageFieldDefaults,
  usePackageFieldDefaults,
} from '../AttributionForm/PackageSubPanel/PackageFields';
import {
  ComparisonRows,
  DerivedPurlRow,
  IndependentComparisonColumns,
} from './ComparisonRows';
import { diffPopupStyles } from './DiffPopup.style';
import {
  ATTRIBUTION_TYPE_FIELD,
  type ComparisonItem,
  COORDINATE_FIELDS,
  type FormAttribute,
  hasPackageInfoChanges,
  isEditable,
  LEGAL_FIELDS,
  NOTE_FIELDS,
  type Side,
  type UpdateField,
} from './DiffPopup.util';

interface ComparisonViewProps {
  items: Record<Side, ComparisonItem>;
  drafts: Record<Side, PackageInfo>;
  dirty: Record<Side, boolean>;
  isBusy: boolean;
  onChange: UpdateField;
  onCopy: (source: Side, destination: Side, key: FormAttribute) => void;
  onUndo: (side: Side, key: FormAttribute) => void;
  onUndoAuditing: (side: Side) => void;
}

const SECTION_LABELS = {
  coordinates: text.attributionColumn.packageCoordinates,
  legal: text.attributionColumn.legalInformation,
} as const;

export function ComparisonView({
  items,
  drafts,
  dirty,
  isBusy,
  onChange,
  onCopy,
  onUndo,
  onUndoAuditing,
}: ComparisonViewProps) {
  const partyTypesDiffer =
    (drafts.left.firstParty === true) !== (drafts.right.firstParty === true);
  const [showLicenseText, setShowLicenseText] = useState(false);
  const packageDefaults: Record<Side, PackageFieldDefaults> = {
    left: usePackageFieldDefaults(drafts.left, !isEditable(items.left)),
    right: usePackageFieldDefaults(drafts.right, !isEditable(items.right)),
  };
  const toggleLicenseText = () => setShowLicenseText((visible) => !visible);

  return (
    <MuiBox sx={diffPopupStyles.content}>
      <ComparisonHeader left={items.left} right={items.right} dirty={dirty} />
      <AuditingComparison
        left={items.left}
        right={items.right}
        drafts={drafts}
        isBusy={isBusy}
        onUpdate={onChange}
        onUndo={onUndoAuditing}
      />
      <MuiBox sx={diffPopupStyles.comparison}>
        <ComparisonSection title={SECTION_LABELS.coordinates}>
          <ComparisonRows
            fields={COORDINATE_FIELDS}
            left={items.left}
            right={items.right}
            drafts={drafts}
            onChange={onChange}
            onCopy={onCopy}
            onUndo={onUndo}
            isBusy={isBusy}
            showLicenseText={showLicenseText}
            onToggleLicenseText={toggleLicenseText}
            packageDefaults={packageDefaults}
          />
        </ComparisonSection>
        <DerivedPurlRow
          drafts={drafts}
          items={items}
          isBusy={isBusy}
          onChange={onChange}
        />
        <ComparisonSection title={SECTION_LABELS.legal}>
          <ComparisonRows
            fields={
              partyTypesDiffer
                ? [ATTRIBUTION_TYPE_FIELD]
                : [ATTRIBUTION_TYPE_FIELD, ...LEGAL_FIELDS]
            }
            left={items.left}
            right={items.right}
            drafts={drafts}
            onChange={onChange}
            onCopy={onCopy}
            onUndo={onUndo}
            isBusy={isBusy}
            showLicenseText={showLicenseText}
            onToggleLicenseText={toggleLicenseText}
            packageDefaults={packageDefaults}
          />
          {partyTypesDiffer && (
            <IndependentComparisonColumns
              fields={[...LEGAL_FIELDS, ...NOTE_FIELDS]}
              left={items.left}
              right={items.right}
              drafts={drafts}
              isBusy={isBusy}
              onChange={onChange}
              onUndo={onUndo}
              showLicenseText={showLicenseText}
              onToggleLicenseText={toggleLicenseText}
              packageDefaults={packageDefaults}
            />
          )}
        </ComparisonSection>
        {!partyTypesDiffer && (
          <ComparisonRows
            fields={NOTE_FIELDS}
            left={items.left}
            right={items.right}
            drafts={drafts}
            onChange={onChange}
            onCopy={onCopy}
            onUndo={onUndo}
            isBusy={isBusy}
            showLicenseText={showLicenseText}
            onToggleLicenseText={toggleLicenseText}
            packageDefaults={packageDefaults}
          />
        )}
      </MuiBox>
    </MuiBox>
  );
}

function ComparisonHeader({
  left,
  right,
  dirty,
}: {
  left: ComparisonItem;
  right: ComparisonItem;
  dirty: Record<Side, boolean>;
}) {
  return (
    <MuiBox
      sx={diffPopupStyles.comparisonHeader}
      role={'group'}
      aria-label={text.diffPopup.comparisonSides}
      data-testid={'comparison-header'}
    >
      <HeaderLabel item={left} dirty={dirty.left} />
      <MuiBox aria-hidden={true} />
      <HeaderLabel item={right} dirty={dirty.right} />
    </MuiBox>
  );
}

function HeaderLabel({
  item,
  dirty,
}: {
  item: ComparisonItem;
  dirty: boolean;
}) {
  return (
    <MuiBox sx={{ minWidth: 0, textAlign: 'center' }}>
      <MuiTypography
        variant={'body2'}
        sx={diffPopupStyles.comparisonHeaderLabel}
        title={item.label}
      >
        {item.label}
      </MuiTypography>
      <MuiTypography variant={'caption'} sx={diffPopupStyles.helper}>
        {item.isExternal
          ? text.diffPopup.signal
          : `${text.diffPopup.attribution}${
              isEditable(item) ? '' : ` · ${text.diffPopup.readOnly}`
            }`}
        {dirty ? ` · ${text.diffPopup.unsavedChanges}` : ''}
      </MuiTypography>
    </MuiBox>
  );
}

function AuditingComparison({
  left,
  right,
  drafts,
  isBusy,
  onUpdate,
  onUndo,
}: {
  left: ComparisonItem;
  right: ComparisonItem;
  drafts: Record<Side, PackageInfo>;
  isBusy: boolean;
  onUpdate: UpdateField;
  onUndo: (side: Side) => void;
}) {
  return (
    <MuiBox
      sx={diffPopupStyles.auditingComparison}
      data-testid={'auditing-comparison'}
    >
      <AuditingColumn
        side={'left'}
        item={left}
        draft={drafts.left}
        isBusy={isBusy}
        onUpdate={onUpdate}
        onUndo={onUndo}
      />
      <MuiBox aria-hidden={true} />
      <AuditingColumn
        side={'right'}
        item={right}
        draft={drafts.right}
        isBusy={isBusy}
        onUpdate={onUpdate}
        onUndo={onUndo}
      />
    </MuiBox>
  );
}

function AuditingColumn({
  side,
  item,
  draft,
  isBusy,
  onUpdate,
  onUndo,
}: {
  side: Side;
  item: ComparisonItem;
  draft: PackageInfo;
  isBusy: boolean;
  onUpdate: UpdateField;
  onUndo: (side: Side) => void;
}) {
  const editable = isEditable(item);
  const hasChanges = hasPackageInfoChanges(
    draft,
    item.packageInfo,
    editable,
    AUDITING_PROPERTY_NAMES,
  );
  return (
    <MuiBox
      sx={diffPopupStyles.auditingColumn}
      data-testid={`${side}-auditing-options`}
    >
      <AuditingOptions
        packageInfo={draft}
        isEditable={editable && !isBusy}
        onUpdate={(patch) => onUpdate(side, patch)}
        sx={diffPopupStyles.auditingOptions}
      />
      {hasChanges && (
        <MuiTooltip title={text.diffPopup.undoChanges}>
          <MuiIconButton
            size={'small'}
            aria-label={text.diffPopup.undoAuditingChanges(item.label)}
            data-testid={`${side}-auditing-undo`}
            disabled={isBusy}
            onClick={() => onUndo(side)}
          >
            <UndoIcon fontSize={'small'} />
          </MuiIconButton>
        </MuiTooltip>
      )}
    </MuiBox>
  );
}

interface ComparisonSectionProps {
  title: string;
  children: ReactNode;
}

function ComparisonSection({ title, children }: ComparisonSectionProps) {
  return (
    <MuiBox sx={diffPopupStyles.section}>
      <MuiBox sx={diffPopupStyles.sectionHeader}>
        <MuiDivider sx={{ flex: 1 }} />
        <MuiTypography variant={'body2'} sx={diffPopupStyles.sectionTitle}>
          {title}
        </MuiTypography>
        <MuiDivider sx={{ flex: 1 }} />
      </MuiBox>
      {children}
    </MuiBox>
  );
}
