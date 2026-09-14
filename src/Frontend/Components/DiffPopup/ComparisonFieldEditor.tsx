// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';
import MuiBox from '@mui/material/Box';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import useEventCallback from '@mui/utils/useEventCallback';
import { memo, useMemo } from 'react';

import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import {
  getPackageAttributeInvalidError,
  isPackageAttributeIncomplete,
} from '../../util/input-validation';
import type { PackagePatch } from '../AttributionForm/attribution-form.types';
import { AttributionTypeField } from '../AttributionForm/attribution-type-field';
import { LicenseNameField } from '../AttributionForm/LicenseSubPanel/LicenseNameField';
import { LicenseTextField } from '../AttributionForm/LicenseSubPanel/LicenseTextField';
import {
  isPackageFieldKey,
  PACKAGE_FIELD_METADATA,
  PackageAutocomplete,
  type PackageAutocompleteAttribute,
} from '../AttributionForm/PackageAutocomplete/PackageAutocomplete';
import {
  type PackageFieldDefaults,
  urlActions,
  useUrlEnrichmentAction,
} from '../AttributionForm/PackageSubPanel/PackageFields';
import type { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
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
  onEdit: Confirm;
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
  onEdit,
}: FieldEditorProps) {
  const itemIsEditable = isEditable(item);
  const isDisabled =
    !itemIsEditable || isLegalFieldDisabled(field.key, draft) || isBusy;
  const isVisible = isFieldVisible(field.key, draft);
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
  const onTextChange = useEventCallback(
    (value: string) =>
      void onEdit(() => onChange(side, { [field.key]: value })),
  );
  const onFieldUndo = useEventCallback(() => onUndo(side, field.key));
  const onPatch = useEventCallback(
    (patch: PackagePatch) => void onEdit(() => onChange(side, patch)),
  );
  const onPackagePatch = useEventCallback((patch: PackagePatch) =>
    onChange(side, patch),
  );
  const onFirstPartyChange = useEventCallback(
    (value: boolean) =>
      void onEdit(() => onChange(side, { firstParty: value })),
  );
  const onLicenseToggle = useEventCallback(() => onToggleLicenseText());
  const undo = useMemo(
    () =>
      isDirty ? (
        <UndoFieldButton
          key={'undo'}
          field={field}
          itemLabel={item.label}
          isBusy={isBusy}
          onUndo={onFieldUndo}
        />
      ) : undefined,
    [field, isBusy, isDirty, item.label, onFieldUndo],
  );
  if (!isVisible) {
    return null;
  }
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
          onChange={onFirstPartyChange}
          onUndo={onFieldUndo}
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
          onUpdate={onPatch}
          showHighlight={showIncomplete}
          disabled={isDisabled && itemIsEditable}
          readOnly={!itemIsEditable}
          forceTop={!!invalidValue}
          showLicenseText={showLicenseText}
          onToggleLicenseText={onLicenseToggle}
          endAdornment={undo}
        />
      );
    }

    if (field.key === 'licenseText') {
      return (
        <LicenseTextField
          {...commonInputProps}
          packageInfo={draft}
          onUpdate={onPatch}
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
        <ComparisonPackageInput
          commonInputProps={commonInputProps}
          attribute={field.key}
          title={PACKAGE_FIELD_METADATA[field.key].label}
          packageInfo={draft}
          defaults={packageDefaults[side][field.key]}
          onUpdate={onPackagePatch}
          onEdit={onEdit}
          readOnly={!itemIsEditable}
          disabled={isBusy}
          showHighlight={showIncomplete}
          editable={itemIsEditable}
          undo={undo}
        />
      );
    }

    return (
      <ComparisonTextInput
        field={field}
        value={formatValue(draft[field.key])}
        disabled={isDisabled && itemIsEditable}
        readOnly={!itemIsEditable}
        error={showIncomplete || !!invalidValue}
        showTooltip={showIncomplete}
        showDifference={showDifference}
        inputDataTestId={`${side}-${field.key}`}
        dirty={isDirty}
        itemLabel={item.label}
        isBusy={isBusy}
        onChange={onTextChange}
        onUndo={onFieldUndo}
      />
    );
  }
}

function ComparisonPackageInput({
  commonInputProps,
  attribute,
  title,
  packageInfo,
  defaults,
  onUpdate,
  onEdit,
  readOnly,
  disabled,
  showHighlight,
  editable,
  undo,
}: {
  commonInputProps: Pick<
    React.ComponentProps<typeof PackageAutocomplete>,
    'inputDataTestId' | 'sx'
  >;
  attribute: PackageAutocompleteAttribute;
  title: string;
  packageInfo: PackageInfo;
  defaults: Array<PackageInfo> | undefined;
  onUpdate: (patch: PackagePatch) => void;
  onEdit: Confirm;
  readOnly: boolean;
  disabled: boolean;
  showHighlight: boolean;
  editable: boolean;
  undo: React.ReactNode;
}) {
  const onEnrich = useUrlEnrichmentAction({ packageInfo, onUpdate, onEdit });
  const needsEnrichment =
    editable &&
    !disabled &&
    !!packageInfo.packageName &&
    !!packageInfo.packageType &&
    !(packageInfo.url && packageInfo.copyright && packageInfo.licenseName);
  const urlEndAdornment = useMemo(
    () => urlActions({ url: packageInfo.url, needsEnrichment, onEnrich }),
    [needsEnrichment, onEnrich, packageInfo.url],
  );
  const combinedUrlEndAdornment = useMemo(
    () => [...urlEndAdornment, ...(undo ? [undo] : [])],
    [undo, urlEndAdornment],
  );
  const endAdornment = attribute === 'url' ? combinedUrlEndAdornment : undo;
  return (
    <PackageAutocomplete
      {...commonInputProps}
      attribute={attribute}
      title={title}
      packageInfo={packageInfo}
      defaults={defaults}
      onUpdate={onUpdate}
      onEdit={onEdit}
      readOnly={readOnly}
      disabled={disabled}
      showHighlight={showHighlight}
      endAdornment={endAdornment}
    />
  );
}

const ComparisonTextInput = memo(
  ({
    field,
    value,
    disabled,
    readOnly,
    error,
    showTooltip,
    showDifference,
    inputDataTestId,
    dirty,
    itemLabel,
    isBusy,
    onChange,
    onUndo,
  }: {
    field: FieldDefinition;
    value: string;
    disabled: boolean;
    readOnly: boolean;
    error: boolean;
    showTooltip: boolean;
    showDifference: boolean;
    inputDataTestId: string;
    dirty: boolean;
    itemLabel: string;
    isBusy: boolean;
    onChange: (value: string) => void;
    onUndo: () => void;
  }) => {
    return (
      <TextBox
        inputDataTestId={inputDataTestId}
        sx={showDifference ? diffPopupStyles.differenceField : undefined}
        title={field.label}
        multiline={field.multiline}
        minRows={field.multiline ? field.rows : undefined}
        maxRows={field.multiline ? field.rows : undefined}
        text={value}
        disabled={disabled}
        readOnly={readOnly}
        error={error}
        placeholder={text.diffPopup.emptyField}
        showTooltip={showTooltip}
        tooltipProps={
          showTooltip ? { title: text.generic.incomplete } : undefined
        }
        handleChange={(event) => onChange(event.target.value)}
        endIcon={
          dirty ? (
            <UndoFieldButton
              field={field}
              itemLabel={itemLabel}
              isBusy={isBusy}
              onUndo={onUndo}
            />
          ) : undefined
        }
      />
    );
  },
);

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
  itemLabel,
  isBusy,
  onUndo,
}: {
  field: FieldDefinition;
  itemLabel: string;
  isBusy: boolean;
  onUndo: () => void;
}) {
  return (
    <MuiTooltip title={text.diffPopup.undoChanges}>
      <MuiIconButton
        size={'small'}
        aria-label={text.diffPopup.undoField(field.label, itemLabel)}
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
