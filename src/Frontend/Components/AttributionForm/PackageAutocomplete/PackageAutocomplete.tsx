// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { createFilterOptions, styled, TextFieldProps } from '@mui/material';
import MuiChip from '@mui/material/Chip';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { compact, groupBy, sortBy } from 'lodash';
import { useEffect, useMemo, useState } from 'react';

import { PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { clickableIcon } from '../../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../../state/hooks';
import {
  useFilteredAttributions,
  useFilteredSignals,
} from '../../../state/variables/use-filtered-data';
import { generatePurl } from '../../../util/handle-purl';
import { isImportantAttributionInformationMissing } from '../../../util/is-important-attribution-information-missing';
import { maybePluralize } from '../../../util/maybe-pluralize';
import { openUrl } from '../../../util/open-url';
import { PackageSearchHooks } from '../../../util/package-search-hooks';
import { Autocomplete } from '../../Autocomplete/Autocomplete';
import { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import { IconButton } from '../../IconButton/IconButton';
import { SourceIcon } from '../../Icons/Icons';

type AutocompleteAttribute = Extract<
  keyof PackageInfo,
  | 'packageType'
  | 'packageNamespace'
  | 'packageName'
  | 'packageVersion'
  | 'url'
  | 'licenseName'
>;

interface Props {
  title: string;
  attribute: AutocompleteAttribute;
  packageInfo: PackageInfo;
  endAdornment?: React.ReactElement | Array<React.ReactElement>;
  defaults?: Array<PackageInfo>;
  readOnly?: boolean;
  disabled?: boolean;
  showHighlight: boolean | undefined;
  onEdit?: Confirm;
  color?: TextFieldProps['color'];
  focused?: boolean;
}

const AddIconButton = styled(MuiIconButton)({
  backgroundColor: 'rgba(0, 0, 0, 0.04)',
  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
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
  onEdit,
  color,
  focused,
}: Props) {
  const dispatch = useAppDispatch();
  const attributeValue = packageInfo[attribute] || '';
  const [inputValue, setInputValue] = useState(attributeValue);

  const { enrichPackageInfo } = PackageSearchHooks.useEnrichPackageInfo();

  const [{ attributions }] = useFilteredAttributions();
  const [{ attributions: signals }] = useFilteredSignals();

  const options = useMemo(
    () => [
      ...sortBy(
        Object.entries(
          groupBy(attributions, (attribution) =>
            attribution.relation === 'unrelated' ? '' : attribution[attribute],
          ),
        )
          .filter(
            ([attributeValue]) => !['', 'undefined'].includes(attributeValue),
          )
          .map<PackageInfo>(([attributeValue, attributions]) => ({
            [attribute]: attributeValue,
            count: attributions.length,
            source: {
              name: text.attributionColumn.fromAttributions,
            },
            id: attributions[0].id,
          })),
        ({ count }) => -(count ?? 0),
      ),
      ...sortBy(
        Object.entries(groupBy(signals, (signal) => signal[attribute]))
          .filter(
            ([attributeValue]) => !['', 'undefined'].includes(attributeValue),
          )
          .map<PackageInfo>(([attributeValue, signals]) => ({
            [attribute]: attributeValue,
            count: signals.length,
            source: {
              name: text.attributionColumn.fromSignals,
            },
            id: signals[0].id,
          })),
        ({ count }) => -(count ?? 0),
      ),
      ...defaults,
    ],
    [attribute, attributions, defaults, signals],
  );

  useEffect(() => {
    if (attributeValue !== inputValue) {
      setInputValue(attributeValue);
    }
  }, [attributeValue, inputValue]);

  return (
    <Autocomplete
      title={title}
      disabled={disabled}
      readOnly={readOnly}
      autoHighlight
      disableClearable
      freeSolo
      inputValue={inputValue}
      inputProps={{ color, focused }}
      error={
        showHighlight &&
        isImportantAttributionInformationMissing(attribute, packageInfo)
      }
      options={options}
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
      renderOptionStartIcon={renderOptionStartIcon}
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
        option[attribute] === value[attribute]
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
      onInputChange={(event, value) =>
        event &&
        packageInfo[attribute] !== value &&
        onEdit?.(() => {
          dispatch(
            setTemporaryDisplayPackageInfo({
              ...packageInfo,
              [attribute]: value,
              wasPreferred: undefined,
            }),
          );
          setInputValue(value);
        })
      }
      endAdornment={endAdornment}
    />
  );

  function renderOptionStartIcon(option: PackageInfo) {
    if (!option.count) {
      return null;
    }

    return (
      <MuiTooltip
        title={maybePluralize(option.count, text.attributionColumn.occurrence, {
          showOne: true,
        })}
        enterDelay={500}
      >
        <MuiChip
          sx={{ minWidth: '24px' }}
          label={new Intl.NumberFormat('en-US', {
            notation: 'compact',
            compactDisplay: 'short',
          }).format(option.count)}
          size={'small'}
        />
      </MuiTooltip>
    );
  }

  function renderOptionEndIcon(
    { id, ...option }: PackageInfo,
    { closePopper }: { closePopper: () => void },
  ) {
    if (!option.synthetic) {
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
            dispatch(
              setTemporaryDisplayPackageInfo(
                (await enrichPackageInfo(merged)) || merged,
              ),
            );
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
