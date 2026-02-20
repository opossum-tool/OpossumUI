// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { createFilterOptions, styled, TextFieldProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { compact, sortBy } from 'lodash';
import { useEffect, useMemo, useState } from 'react';

import { Criticality, PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { clickableIcon, OpossumColors } from '../../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import { getSelectedResourceId } from '../../../state/selectors/resource-selectors';
import { backend } from '../../../util/backendClient';
import { generatePurl } from '../../../util/handle-purl';
import {
  getPackageAttributeInvalidError,
  isPackageAttributeIncomplete,
} from '../../../util/input-validation';
import { openUrl } from '../../../util/open-url';
import { PackageSearchHooks } from '../../../util/package-search-hooks';
import { Autocomplete } from '../../Autocomplete/Autocomplete';
import { renderOccuranceCount } from '../../Autocomplete/AutocompleteUtil';
import { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import { IconButton } from '../../IconButton/IconButton';
import { SourceIcon } from '../../Icons/Icons';
import { ValidationDisplay } from '../../ValidationDisplay/ValidationDisplay';

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
  endAdornment?: React.ReactNode | Array<React.ReactNode>;
  defaults?: Array<PackageInfo>;
  readOnly?: boolean;
  disabled?: boolean;
  showHighlight: boolean | undefined;
  onEdit?: Confirm;
  color?: TextFieldProps['color'];
  focused?: boolean;
  disableCloseOnSelect?: boolean;
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
  onEdit,
  color,
  focused,
  disableCloseOnSelect,
}: Props) {
  const dispatch = useAppDispatch();
  const attributeValue = packageInfo[attribute] || '';
  const [inputValue, setInputValue] = useState(attributeValue);

  const { enrichPackageInfo } = PackageSearchHooks.useEnrichPackageInfo();

  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const autoCompleteResult = backend.autoCompleteOptions.useQuery({
    attributeName: attribute,
    onlyRelatedToResourcePath: selectedResourceId,
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

  useEffect(() => {
    if (attributeValue !== inputValue) {
      setInputValue(attributeValue);
    }
  }, [attributeValue, inputValue]);

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
      }}
    >
      <Autocomplete<PackageInfo, false, true, true>
        title={title}
        disabled={disabled}
        readOnly={readOnly}
        autoHighlight
        disableClearable
        freeSolo
        inputValue={inputValue}
        inputProps={{ color, focused }}
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
        renderOptionStartIcon={(option) => renderOccuranceCount(option.count)}
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
        onChange={(_, value) =>
          typeof value !== 'string' &&
          value[attribute] !== packageInfo[attribute] &&
          onEdit?.(() => {
            dispatch(
              setTemporaryDisplayPackageInfo({
                ...packageInfo,
                [attribute]: value[attribute],
                ...(attribute === 'licenseName' ? { licenseText: '' } : null),
                wasPreferred: undefined,
              }),
            );
          })
        }
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
