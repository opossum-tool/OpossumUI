// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { createFilterOptions, styled, TextFieldProps } from '@mui/material';
import MuiBadge from '@mui/material/Badge';
import MuiChip from '@mui/material/Chip';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { compact } from 'lodash';
import { useEffect, useMemo, useState } from 'react';

import { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { clickableIcon } from '../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getExternalAttributionSources } from '../../state/selectors/all-views-resource-selectors';
import { isAuditViewSelected } from '../../state/selectors/view-selector';
import { useAutocompleteSignals } from '../../state/variables/use-autocomplete-signals';
import { generatePurl } from '../../util/handle-purl';
import { isImportantAttributionInformationMissing } from '../../util/is-important-attribution-information-missing';
import { omit } from '../../util/lodash-extension-utils';
import { maybePluralize } from '../../util/maybe-pluralize';
import { openUrl } from '../../util/open-url';
import { PackageSearchHooks } from '../../util/package-search-hooks';
import { Autocomplete } from '../Autocomplete/Autocomplete';
import { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import { IconButton } from '../IconButton/IconButton';
import { PreferredIcon, SourceIcon, WasPreferredIcon } from '../Icons/Icons';

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
  highlight?: 'default' | 'dark';
  endAdornment?: React.ReactElement;
  defaults?: Array<PackageInfo>;
  readOnly?: boolean;
  disabled?: boolean;
  showHighlight: boolean | undefined;
  onEdit?: Confirm;
  color?: TextFieldProps['color'];
  focused?: boolean;
}

const Badge = styled(MuiBadge)({
  '& .MuiBadge-badge': {
    top: '2px',
    right: '2px',
    zIndex: 0,
  },
});

const AddIconButton = styled(MuiIconButton)({
  backgroundColor: 'rgba(0, 0, 0, 0.04)',
  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
});

export function PackageAutocomplete({
  attribute,
  title,
  packageInfo,
  highlight = 'default',
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
  const sources = useAppSelector(getExternalAttributionSources);
  const isAuditView = useAppSelector(isAuditViewSelected);

  const { enrichPackageInfo } = PackageSearchHooks.useEnrichPackageInfo();

  const [autocompleteSignals] = useAutocompleteSignals();
  const filteredSignals = useMemo(
    () =>
      isAuditView
        ? autocompleteSignals
            .filter((signal) => !['', undefined].includes(signal[attribute]))
            .concat(defaults)
        : defaults,
    [isAuditView, autocompleteSignals, defaults, attribute],
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
      highlight={
        showHighlight &&
        isImportantAttributionInformationMissing(attribute, packageInfo)
          ? highlight
          : undefined
      }
      options={filteredSignals}
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
      groupBy={(option) =>
        option.source
          ? sources[option.source.name]?.name || option.source.name
          : text.attributionColumn.manualAttributions
      }
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

    const tooltipTitle = [
      `${maybePluralize(option.count, text.attributionColumn.occurrence)} ${
        text.attributionColumn.amongSignals
      }`,
      ...(() => {
        if (option.preferred) {
          return [text.auditingOptions.currentlyPreferred.toLowerCase()];
        }
        if (option.wasPreferred) {
          return [text.auditingOptions.previouslyPreferred.toLowerCase()];
        }
        return [];
      })(),
    ].join(' • ');

    return (
      <MuiTooltip title={tooltipTitle} enterDelay={500}>
        <Badge
          badgeContent={(() => {
            if (option.preferred) {
              return <PreferredIcon noTooltip />;
            }
            if (option.wasPreferred) {
              return <WasPreferredIcon noTooltip />;
            }
            return null;
          })()}
        >
          <MuiChip label={option.count} size={'small'} />
        </Badge>
      </MuiTooltip>
    );
  }

  function renderOptionEndIcon(
    option: PackageInfo,
    { closePopper }: { closePopper: () => void },
  ) {
    if (!option.packageName || !option.packageType) {
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
            const merged: PackageInfo = {
              ...packageInfo,
              ...omit(option, ['preSelected', 'id']),
            };
            dispatch(
              setTemporaryDisplayPackageInfo(
                (option.synthetic && (await enrichPackageInfo(merged))) ||
                  merged,
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
