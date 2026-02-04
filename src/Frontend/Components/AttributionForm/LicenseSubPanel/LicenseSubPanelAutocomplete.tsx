// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { groupBy, sortBy } from 'lodash';
import { useCallback, useMemo } from 'react';

import { Attributions, PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import { getFrequentLicensesNameOrder } from '../../../state/selectors/resource-selectors';
import {
  useFilteredAttributions,
  useFilteredSignals,
} from '../../../state/variables/use-filtered-data';
import { validateSpdxExpression } from '../../../util/spdx/validate-spdx';
import { Autocomplete } from '../../Autocomplete/Autocomplete';
import { renderOccuranceCount } from '../../Autocomplete/AutocompleteUtil';
import { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import { SourceIcon } from '../../Icons/Icons';
import { AttributionFormConfig } from '../AttributionForm';
import { SpdxValidationDisplay } from './SpdxValidationDisplay';

interface LicenseAutocompleteProps {
  packageInfo: PackageInfo;
  showHighlight?: boolean;
  onEdit?: Confirm;
  config?: AttributionFormConfig;
  forceTop?: boolean;
}

export function LicenseSubPanelAutocomplete({
  packageInfo,
  showHighlight,
  onEdit,
  config,
  forceTop,
}: LicenseAutocompleteProps) {
  const dispatch = useAppDispatch();
  const frequentLicensesNames = useAppSelector(getFrequentLicensesNameOrder);
  const frequentLicenseNameSet = new Set(
    frequentLicensesNames.map((n) => n.shortName),
  );

  const [{ attributions }] = useFilteredAttributions();
  const [{ attributions: signals }] = useFilteredSignals();

  function splitAtLastExpression(input: string | undefined): [string, string] {
    if (input === undefined) {
      return ['', ''];
    }
    return input
      .match(/(.*(?:(?: AND | OR | WITH |^)\(*))(.*)$/i)
      ?.slice(1) as [string, string];
  }

  type LicenseOption = {
    shortName: string;
    fullName: string | undefined;
    attributionCount?: number;
    group: string;
    replaceEntireSearch: boolean;
  };

  const attributionsToLicenseOptions = useCallback(
    (
      attributions: Attributions,
      removeUnrelated: boolean,
      group: string,
    ): Array<LicenseOption> => {
      return sortBy(
        Object.entries(
          groupBy(attributions, (attribution) =>
            removeUnrelated && attribution.relation === 'unrelated'
              ? ''
              : attribution.licenseName,
          ),
        )
          .filter(
            ([licenseName]) =>
              !(licenseName === 'undefined' || licenseName === ''),
          )
          .map<LicenseOption>(([attributeValue, attributions]) => ({
            shortName: attributeValue,
            fullName: undefined,
            attributionCount: attributions.length,
            group,
            replaceEntireSearch: true,
          })),
        ({ attributionCount }) => -(attributionCount ?? 0),
      );
    },
    [],
  );

  const licenseOptions = useMemo<Array<LicenseOption>>(
    () => [
      ...frequentLicensesNames.map((license) => ({
        fullName: license.fullName,
        shortName: license.shortName,
        group: text.attributionColumn.commonLicenses,
        replaceEntireSearch: false,
      })),
      ...attributionsToLicenseOptions(
        attributions ?? {},
        true,
        text.attributionColumn.fromAttributions,
      ),
      ...attributionsToLicenseOptions(
        signals ?? {},
        false,
        text.attributionColumn.fromSignals,
      ),
    ],
    [
      frequentLicensesNames,
      attributionsToLicenseOptions,
      attributions,
      signals,
    ],
  );

  function filterOptions(
    options: Array<LicenseOption>,
    inputValue: string,
  ): Array<LicenseOption> {
    const [beforeLast, lastLicense] = splitAtLastExpression(inputValue);
    const hasExpressionBeforeLastWord = beforeLast !== '';
    const autocompleteOptions = options.filter((option) => {
      // Selecting signals or attributions replaces everything, so you have to filter on the full input and not just the last part.
      if (option.replaceEntireSearch) {
        return option.shortName
          .toUpperCase()
          .includes(inputValue.toUpperCase());
      } else if (hasExpressionBeforeLastWord || beforeLast === '') {
        return `${option.shortName},${option.fullName}`
          .toUpperCase()
          .includes(lastLicense.toUpperCase());
      }
      return false;
    });
    if (
      autocompleteOptions.length === 1 &&
      autocompleteOptions[0].shortName === lastLicense.trim()
    ) {
      return [];
    }
    return autocompleteOptions;
  }

  const validationResult = validateSpdxExpression({
    spdxExpression: packageInfo.licenseName ?? '',
    knownLicenseIds: frequentLicenseNameSet,
  });

  const handleApplyFix = (newExpression: string) => {
    dispatch(
      setTemporaryDisplayPackageInfo({
        ...packageInfo,
        licenseName: newExpression,
        wasPreferred: undefined,
      }),
    );
  };

  return (
    <MuiBox
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        flexBasis: 0,
      }}
      data-testid="license-sub-panel"
    >
      <Autocomplete<LicenseOption, false, true, true>
        value={''}
        options={licenseOptions}
        title={text.attributionColumn.licenseExpression}
        readOnly={!onEdit}
        highlighting={
          showHighlight && !packageInfo.licenseName ? 'warning' : undefined
        }
        inputValue={packageInfo.licenseName ?? ''}
        getOptionLabel={(option) =>
          typeof option === 'string' ? option : option.shortName
        }
        getOptionKey={(option) =>
          typeof option === 'string' ? option : option.group + option.shortName
        }
        renderOptionStartIcon={(option) =>
          renderOccuranceCount(option.attributionCount)
        }
        filterOptions={(options, state) =>
          filterOptions(options, state.inputValue)
        }
        groupBy={(option) => option.group}
        groupProps={{ icon: () => <SourceIcon noTooltip /> }}
        forceTop={forceTop}
        optionText={{
          primary: (option) =>
            typeof option === 'string'
              ? option
              : option.replaceEntireSearch ||
                  splitAtLastExpression(packageInfo.licenseName)[0] === ''
                ? option.shortName
                : `... ${option.shortName}`,
          secondary: (option) =>
            typeof option === 'string' ? null : option.fullName,
        }}
        onChange={(_, value) =>
          typeof value !== 'string' &&
          onEdit?.(() => {
            dispatch(
              setTemporaryDisplayPackageInfo({
                ...packageInfo,
                licenseName: value.replaceEntireSearch
                  ? value.shortName
                  : `${splitAtLastExpression(packageInfo.licenseName)[0]}${value.shortName}`,
                licenseText: '',
                wasPreferred: undefined,
              }),
            );
          })
        }
        onInputChange={(event, value) =>
          event &&
          onEdit?.(() => {
            dispatch(
              setTemporaryDisplayPackageInfo({
                ...packageInfo,
                licenseName: value,
                wasPreferred: undefined,
              }),
            );
          })
        }
        inputProps={{
          color: config?.licenseName?.color,
          focused: config?.licenseName?.focused,
        }}
        endAdornment={config?.licenseName?.endIcon}
        autoHighlight
        disableClearable
        freeSolo
      />
      {!!onEdit && (
        <SpdxValidationDisplay
          validationResult={validationResult}
          onApplyFix={handleApplyFix}
        />
      )}
    </MuiBox>
  );
}
