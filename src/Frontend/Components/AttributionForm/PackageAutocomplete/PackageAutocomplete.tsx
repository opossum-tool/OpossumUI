// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  createFilterOptions,
  styled,
  type TextFieldProps,
} from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import type { SxProps } from '@mui/system';
import { compact, sortBy } from 'lodash-es';
import { useMemo } from 'react';

import { Criticality, type PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { clickableIcon, OpossumColors } from '../../../shared-styles';
import { backend } from '../../../util/backendClient';
import { generatePurl } from '../../../util/handle-purl';
import {
  getPackageAttributeInvalidError,
  isPackageAttributeIncomplete,
} from '../../../util/input-validation';
import { openUrl } from '../../../util/open-url';
import { PackageSearchHooks } from '../../../util/package-search-hooks';
import { Autocomplete } from '../../Autocomplete/Autocomplete';
import { renderOccurrenceCount } from '../../Autocomplete/AutocompleteUtil';
import type { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import { IconButton } from '../../IconButton/IconButton';
import { SourceIcon } from '../../Icons/Icons';
import { ValidationDisplay } from '../../ValidationDisplay/ValidationDisplay';
import type { PackagePatch } from '../attribution-form.types';

export type PackageAutocompleteAttribute = Extract<
  keyof PackageInfo,
  | 'packageType'
  | 'packageNamespace'
  | 'packageName'
  | 'packageVersion'
  | 'url'
  | 'licenseName'
>;

export const PACKAGE_FIELD_KEYS = [
  'packageName',
  'packageNamespace',
  'packageVersion',
  'packageType',
  'url',
] as const satisfies ReadonlyArray<PackageAutocompleteAttribute>;

export const PACKAGE_FIELD_METADATA: Record<
  PackageAutocompleteAttribute,
  { label: string }
> = {
  packageName: { label: text.attributionColumn.packageName },
  packageNamespace: { label: text.attributionColumn.packageNamespace },
  packageVersion: { label: text.attributionColumn.packageVersion },
  packageType: { label: text.attributionColumn.packageType },
  url: { label: text.attributionColumn.upstreamAddress },
  licenseName: { label: text.attributionColumn.licenseExpression },
};

export function isPackageFieldKey(
  key: string,
): key is (typeof PACKAGE_FIELD_KEYS)[number] {
  return PACKAGE_FIELD_KEYS.includes(
    key as (typeof PACKAGE_FIELD_KEYS)[number],
  );
}

interface Props {
  title: string;
  attribute: PackageAutocompleteAttribute;
  packageInfo: PackageInfo;
  endAdornment?: React.ReactNode | Array<React.ReactNode>;
  defaults?: Array<PackageInfo>;
  readOnly?: boolean;
  disabled?: boolean;
  showHighlight: boolean | undefined;
  onUpdate: (patch: PackagePatch) => void;
  onEdit?: Confirm;
  color?: TextFieldProps['color'];
  focused?: boolean;
  disableCloseOnSelect?: boolean;
  inputDataTestId?: string;
  sx?: SxProps;
}

const AddIconButton = styled(MuiIconButton)({
  backgroundColor: OpossumColors.lightestGrey,
  '&:hover': { backgroundColor: OpossumColors.lightGrey },
});

export function PackageAutocomplete({
  attribute,
  title,
  packageInfo,
  endAdornment,
  defaults = [],
  readOnly,
  disabled,
  showHighlight,
  onUpdate,
  onEdit,
  color,
  focused,
  disableCloseOnSelect,
  inputDataTestId,
  sx,
}: Props) {
  const attributeValue = packageInfo[attribute] || '';
  const { enrichPackageInfo } = PackageSearchHooks.useEnrichPackageInfo();

  const autoCompleteResult = backend.autoCompleteOptions.useQuery({
    attributeName: attribute,
  });

  const options = useMemo(() => {
    const manual = autoCompleteResult.data
      ? toPackageInfoOptions(
          attribute,
          autoCompleteResult.data.manual,
          text.attributionColumn.fromAttributions,
        )
      : [];
    const external = autoCompleteResult.data
      ? toPackageInfoOptions(
          attribute,
          autoCompleteResult.data.external,
          text.attributionColumn.fromSignals,
        )
      : [];

    return [...defaults, ...manual, ...external];
  }, [attribute, autoCompleteResult.data, defaults]);

  const highlighting = useMemo(() => {
    if (!showHighlight) {
      return undefined;
    }
    if (isPackageAttributeIncomplete(attribute, packageInfo)) {
      return 'warning';
    }
    return undefined;
  }, [attribute, packageInfo, showHighlight]);

  const errorMessage = getPackageAttributeInvalidError(attribute, packageInfo);

  return (
    <MuiBox
      data-testid={`autocomplete-${attribute}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        flexBasis: 0,
        ...sx,
      }}
    >
      <Autocomplete<PackageInfo, false, true, true>
        title={title}
        disabled={disabled}
        readOnly={readOnly}
        autoHighlight
        disableClearable
        freeSolo
        inputValue={attributeValue}
        inputProps={{ color, focused }}
        inputDataTestId={inputDataTestId}
        highlighting={highlighting}
        options={options}
        forceTop={!!errorMessage}
        getOptionLabel={(option) =>
          typeof option === 'string' ? option : option[attribute] || ''
        }
        getOptionKey={(option) =>
          typeof option === 'string'
            ? option
            : compact([
                option.copyright,
                option.licenseName,
                option[attribute],
                generatePurl(option),
              ]).join()
        }
        renderOptionStartIcon={(option) => renderOccurrenceCount(option.count)}
        renderOptionEndIcon={renderOptionEndIcon}
        value={packageInfo}
        filterOptions={createFilterOptions({
          stringify: (option) => {
            switch (attribute) {
              case 'packageName':
                return `${option.packageName || ''}${option.packageNamespace || ''}`;
              default:
                return `${option[attribute] || ''} ${option.suffix || ''}`.trim();
            }
          },
        })}
        isOptionEqualToValue={(option, value) =>
          typeof value === 'string'
            ? false
            : option[attribute] === value[attribute]
        }
        groupBy={(option) => option.source?.name || text.generic.unknown}
        groupProps={{
          icon: () => <SourceIcon noTooltip />,
          action: ({ name }) => (
            <IconButton
              hidden={name !== text.attributionColumn.openSourceInsights}
              onClick={() => openUrl('https://www.deps.dev')}
              icon={<OpenInNewIcon sx={clickableIcon} />}
            />
          ),
        }}
        optionText={{
          primary: (option) => {
            if (typeof option === 'string') {
              return option;
            }

            const optionValue = option[attribute];

            if (!optionValue) {
              return '';
            }

            return `${optionValue} ${option.suffix || ''}`.trim();
          },
          secondary: (option) =>
            typeof option === 'string' ? option : generatePurl(option),
        }}
        onChange={async (_, value) => {
          if (readOnly || disabled) {
            return;
          }
          if (
            typeof value !== 'string' &&
            value[attribute] !== packageInfo[attribute]
          ) {
            const update = () =>
              onUpdate({
                [attribute]: value[attribute],
                ...(attribute === 'licenseName' ? { licenseText: '' } : null),
              });
            if (onEdit) {
              await onEdit(update);
            } else {
              update();
            }
          }
        }}
        onInputChange={async (event, value) => {
          if (readOnly || disabled) {
            return;
          }
          if (event && packageInfo[attribute] !== value) {
            const update = () => onUpdate({ [attribute]: value });
            if (onEdit) {
              await onEdit(update);
            } else {
              update();
            }
          }
        }}
        endAdornment={endAdornment}
        disableCloseOnSelect={disableCloseOnSelect}
      />
      <ValidationDisplay
        messages={errorMessage ? [errorMessage] : []}
        severity="error"
      />
    </MuiBox>
  );

  function renderOptionEndIcon(
    { id, ...option }: PackageInfo,
    { closePopper }: { closePopper: () => void },
  ) {
    if (!option.synthetic || readOnly || disabled) {
      return null;
    }

    return (
      <MuiTooltip
        title={text.attributionColumn.useAutocompleteSuggestion}
        enterDelay={1000}
        disableInteractive
      >
        <AddIconButton
          onClick={async (event) => {
            event.stopPropagation();
            const merged: PackageInfo = { ...packageInfo, ...option };
            const enriched = (await enrichPackageInfo(merged)) || merged;
            onUpdate(toPackagePatch(enriched));
            closePopper();
          }}
          size={'small'}
        >
          <AddIcon fontSize={'inherit'} color={'primary'} />
        </AddIconButton>
      </MuiTooltip>
    );
  }
}

export function toPackagePatch(packageInfo: PackageInfo): PackagePatch {
  return {
    packageName: packageInfo.packageName,
    packageNamespace: packageInfo.packageNamespace,
    packageVersion: packageInfo.packageVersion,
    packageType: packageInfo.packageType,
    url: packageInfo.url,
    copyright: packageInfo.copyright,
    licenseName: packageInfo.licenseName,
    licenseText: packageInfo.licenseText,
    comment: packageInfo.comment,
  };
}

function toPackageInfoOptions<A extends string>(
  attributeName: A,
  items: Array<{
    contained_uuid: string;
    value: string;
    count: number;
  }>,
  sourceName: string,
): Array<PackageInfo> {
  return sortBy(
    items.map<PackageInfo>((item) => ({
      [attributeName]: item.value,
      count: item.count,
      source: { name: sourceName },
      criticality: Criticality.None,
      id: item.contained_uuid,
    })),
    ({ count }) => -(count ?? 0),
  );
}
