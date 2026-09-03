// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';
import MuiBox from '@mui/material/Box';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';

import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import {
  getPackageAttributeInvalidError,
  isPackageAttributeIncomplete,
} from '../../util/input-validation';
import { AttributionTypeField } from '../AttributionForm/attribution-type-field';
import { LicenseNameField } from '../AttributionForm/LicenseSubPanel/LicenseNameField';
import { LicenseTextField } from '../AttributionForm/LicenseSubPanel/LicenseTextField';
import {
  isPackageFieldKey,
  PACKAGE_FIELD_METADATA,
  PackageAutocomplete,
} from '../AttributionForm/PackageAutocomplete/PackageAutocomplete';
import {
  type PackageFieldDefaults,
  urlActions,
} from '../AttributionForm/PackageSubPanel/PackageFields';
import { TextBox } from '../TextBox/TextBox';
import { ValidationDisplay } from '../ValidationDisplay/ValidationDisplay';
import { diffPopupStyles } from './DiffPopup.style';
import {
  type ComparisonItem,
  type FieldDefinition,
  type FormAttribute,
  hasPackageInfoChanges,
  isEditable,
  isFieldVisible,
  isLegalFieldDisabled,
  type Side,
  type UpdateField,
} from './DiffPopup.util';

interface FieldEditorProps {
  side: Side;
  item: ComparisonItem;
  field: FieldDefinition;
  draft: PackageInfo;
  openingPackageInfo: PackageInfo;
  isBusy: boolean;
  different?: boolean;
  onChange: UpdateField;
  onUndo: (side: Side, key: FormAttribute) => void;
  showLicenseText: boolean;
  onToggleLicenseText: () => void;
  packageDefaults: Record<Side, PackageFieldDefaults>;
}

export function ComparisonFieldEditor({
  side,
  item,
  field,
  draft,
  openingPackageInfo,
  isBusy,
  different = false,
  onChange,
  onUndo,
  showLicenseText,
  onToggleLicenseText,
  packageDefaults,
}: FieldEditorProps) {
  const itemIsEditable = isEditable(item);
  const isDisabled =
    !itemIsEditable || isLegalFieldDisabled(field.key, draft) || isBusy;
  if (!isFieldVisible(field.key, draft)) {
    return null;
  }
  const isDirty = hasPackageInfoChanges(
    draft,
    openingPackageInfo,
    itemIsEditable,
    [field.key],
  );
  const incomplete = isPackageAttributeIncomplete(field.key, draft);
  const invalidValue = getPackageAttributeInvalidError(field.key, draft);
  const showIncomplete = itemIsEditable && incomplete;
  const showDifference = different && !showIncomplete && !invalidValue;
  return (
    <MuiBox
      sx={{ minWidth: 0 }}
      data-dirty={isDirty ? 'true' : 'false'}
      data-testid={`${side}-${field.key}-field`}
    >
      {renderInput()}
      {!isPackageFieldKey(field.key) && (
        <ValidationDisplay
          messages={invalidValue ? [invalidValue] : []}
          severity={'error'}
        />
      )}
    </MuiBox>
  );

  function renderInput() {
    const undo = isDirty ? (
      <UndoFieldButton
        key={'undo'}
        field={field}
        item={item}
        isBusy={isBusy}
        onUndo={() => onUndo(side, field.key)}
      />
    ) : undefined;
    const commonInputProps = {
      inputDataTestId: `${side}-${field.key}`,
      sx: showDifference ? diffPopupStyles.differenceField : undefined,
    };

    if (field.key === 'firstParty') {
      return (
        <AttributionTypeInput
          value={draft.firstParty}
          disabled={isDisabled}
          dirty={isDirty}
          openingValue={openingPackageInfo.firstParty}
          itemLabel={item.label}
          onChange={(value) => onChange(side, { firstParty: value })}
          onUndo={() => onUndo(side, field.key)}
          isBusy={isBusy}
        />
      );
    }

    if (field.key === 'licenseName') {
      return (
        <LicenseNameField
          {...commonInputProps}
          licenseName={draft.licenseName}
          licenseText={draft.licenseText}
          onUpdate={(patch) => onChange(side, patch)}
          showHighlight={showIncomplete}
          disabled={isDisabled && itemIsEditable}
          readOnly={!itemIsEditable}
          forceTop={!!invalidValue}
          showLicenseText={showLicenseText}
          onToggleLicenseText={onToggleLicenseText}
          endAdornment={undo}
        />
      );
    }

    if (field.key === 'licenseText') {
      return (
        <LicenseTextField
          {...commonInputProps}
          packageInfo={draft}
          onUpdate={(patch) => onChange(side, patch)}
          showHighlight={showIncomplete}
          disabled={isDisabled && itemIsEditable}
          readOnly={!itemIsEditable}
          minRows={field.rows}
          maxRows={field.rows}
          endIcon={undo}
        />
      );
    }

    if (isPackageFieldKey(field.key)) {
      return (
        <PackageAutocomplete
          {...commonInputProps}
          attribute={field.key}
          title={PACKAGE_FIELD_METADATA[field.key].label}
          packageInfo={draft}
          defaults={packageDefaults[side][field.key]}
          onUpdate={(patch) => onChange(side, patch)}
          readOnly={!itemIsEditable}
          disabled={isBusy}
          showHighlight={showIncomplete}
          endAdornment={[
            ...(field.key === 'url'
              ? urlActions({
                  packageInfo: draft,
                  onUpdate: (patch) => onChange(side, patch),
                  editable: itemIsEditable && !isBusy,
                })
              : []),
            ...(undo ? [undo] : []),
          ]}
        />
      );
    }

    return (
      <TextBox
        {...commonInputProps}
        title={field.label}
        multiline={field.multiline}
        minRows={field.multiline ? field.rows : undefined}
        maxRows={field.multiline ? field.rows : undefined}
        text={formatValue(draft[field.key])}
        disabled={isDisabled && itemIsEditable}
        readOnly={!itemIsEditable}
        error={showIncomplete || !!invalidValue}
        placeholder={text.diffPopup.emptyField}
        showTooltip={showIncomplete}
        tooltipProps={
          showIncomplete ? { title: text.generic.incomplete } : undefined
        }
        handleChange={(event) =>
          onChange(side, { [field.key]: event.target.value })
        }
        endIcon={undo}
      />
    );
  }
}

function AttributionTypeInput({
  value,
  disabled,
  dirty,
  openingValue,
  itemLabel,
  onChange,
  onUndo,
  isBusy,
}: {
  value: PackageInfo['firstParty'];
  disabled: boolean;
  dirty: boolean;
  openingValue: PackageInfo['firstParty'];
  itemLabel: string;
  onChange: (value: boolean) => void;
  onUndo: () => void;
  isBusy: boolean;
}) {
  return (
    <MuiBox sx={diffPopupStyles.attributionTypeField}>
      <AttributionTypeField
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
      {dirty && (
        <MuiTooltip title={text.diffPopup.undoChanges}>
          <MuiIconButton
            size={'small'}
            sx={diffPopupStyles.attributionTypeUndo}
            aria-label={text.diffPopup.restoreField(
              formatAttributionType(openingValue),
              itemLabel,
            )}
            disabled={isBusy}
            onClick={onUndo}
          >
            {openingValue === true ? (
              <RedoIcon fontSize={'small'} />
            ) : (
              <UndoIcon fontSize={'small'} />
            )}
          </MuiIconButton>
        </MuiTooltip>
      )}
    </MuiBox>
  );
}

function UndoFieldButton({
  field,
  item,
  isBusy,
  onUndo,
}: {
  field: FieldDefinition;
  item: ComparisonItem;
  isBusy: boolean;
  onUndo: () => void;
}) {
  return (
    <MuiTooltip title={text.diffPopup.undoChanges}>
      <MuiIconButton
        size={'small'}
        aria-label={text.diffPopup.undoField(field.label, item.label)}
        disabled={isBusy}
        onClick={onUndo}
      >
        <UndoIcon fontSize={'small'} />
      </MuiIconButton>
    </MuiTooltip>
  );
}

function formatAttributionType(value: PackageInfo['firstParty']): string {
  return value === true ? text.filters.firstParty : text.filters.thirdParty;
}

function formatValue(value: PackageInfo[FormAttribute]): string {
  return typeof value === 'boolean'
    ? value
      ? text.filters.firstParty
      : text.filters.thirdParty
    : typeof value === 'number'
      ? String(value)
      : (value ?? '');
}
