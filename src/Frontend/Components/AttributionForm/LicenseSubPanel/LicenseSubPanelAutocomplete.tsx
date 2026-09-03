// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import type { SystemStyleObject } from '@mui/system';
import { sortBy } from 'lodash-es';
import { useMemo } from 'react';

import type { PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { backend } from '../../../util/backendClient';
import { validateSpdxExpression } from '../../../util/spdx/validate-spdx';
import { Autocomplete } from '../../Autocomplete/Autocomplete';
import { renderOccurrenceCount } from '../../Autocomplete/AutocompleteUtil';
import { SourceIcon } from '../../Icons/Icons';
import { SpdxValidationDisplay } from './SpdxValidationDisplay';

export type LicensePatch = Pick<PackageInfo, 'licenseName' | 'licenseText'>;

interface LicenseAutocompleteProps {
  licenseName: PackageInfo['licenseName'];
  licenseText: PackageInfo['licenseText'];
  onUpdate: (patch: LicensePatch) => void;
  showHighlight?: boolean;
  forceTop?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  sx?: SystemStyleObject;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode | Array<React.ReactNode>;
  inputDataTestId?: string;
}

export function LicenseSubPanelAutocomplete({
  licenseName,
  licenseText,
  onUpdate,
  showHighlight,
  forceTop,
  disabled,
  readOnly,
  sx,
  startAdornment,
  endAdornment,
  inputDataTestId,
}: LicenseAutocompleteProps) {
  const frequentLicenseNames = backend.getFrequentLicenseNames.useQuery();
  const frequentLicenseNameSet = new Set(
    frequentLicenseNames.data?.map((n) => n.shortName),
  );

  const autoCompleteResult = backend.autoCompleteOptions.useQuery({
    attributeName: 'licenseName',
  });

  function splitAtLastExpression(input: string | undefined): [string, string] {
    if (input === undefined) {
      return ['', ''];
    }
    return input
      .match(/(.*(?:(?: AND | OR | WITH |^)\(*))(.*)$/i)
      ?.slice(1) as [string, string];
  }

  const licenseOptions = useMemo<Array<LicenseOption>>(() => {
    const manual = autoCompleteResult.data
      ? toLicenseOptions(
          autoCompleteResult.data.manual,
          text.attributionColumn.fromAttributions,
        )
      : [];
    const external = autoCompleteResult.data
      ? toLicenseOptions(
          autoCompleteResult.data.external,
          text.attributionColumn.fromSignals,
        )
      : [];

    const frequentLicenseNameSetLowercase = new Set(
      frequentLicenseNames.data?.map((n) => n.shortName.toLowerCase()),
    );

    const manualFiltered = manual.filter(
      (license) =>
        !frequentLicenseNameSetLowercase.has(license.shortName.toLowerCase()),
    );
    const externalFiltered = external.filter(
      (license) =>
        !frequentLicenseNameSetLowercase.has(license.shortName.toLowerCase()),
    );

    const manualCountMap = new Map(
      manual.map((license) => [
        license.shortName.toLowerCase(),
        license.attributionCount as number,
      ]),
    );
    const externalCountMap = new Map(
      external.map((license) => [
        license.shortName.toLowerCase(),
        license.attributionCount as number,
      ]),
    );

    const frequentLicenseOptions = frequentLicenseNames.data?.map(
      (license) => ({
        fullName: license.fullName,
        shortName: license.shortName,
        group: text.attributionColumn.commonLicenses,
        attributionCount: [
          manualCountMap.get(license.shortName.toLowerCase()) ?? 0,
          externalCountMap.get(license.shortName.toLowerCase()) ?? 0,
        ] as [number, number],
        replaceEntireSearch: false,
      }),
    );

    const sortedFrequentLicenseOptions = sortBy(
      frequentLicenseOptions,
      (license) => -(license.attributionCount[0] + license.attributionCount[1]),
    );

    return [
      ...sortedFrequentLicenseOptions,
      ...manualFiltered,
      ...externalFiltered,
    ];
  }, [frequentLicenseNames.data, autoCompleteResult.data]);

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
    spdxExpression: licenseName ?? '',
    knownLicenseIds: frequentLicenseNameSet,
  });

  const isEditable = !disabled && !readOnly;

  return (
    <MuiBox
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        flexBasis: 0,
        ...sx,
      }}
      data-testid="license-sub-panel"
    >
      <Autocomplete<LicenseOption, false, true, true>
        value={''}
        options={licenseOptions}
        title={text.attributionColumn.licenseExpression}
        disabled={disabled}
        readOnly={readOnly}
        highlighting={
          showHighlight && !licenseName && !licenseText ? 'warning' : undefined
        }
        inputValue={licenseName ?? ''}
        inputDataTestId={inputDataTestId}
        getOptionLabel={(option) =>
          typeof option === 'string' ? option : option.shortName
        }
        getOptionKey={(option) =>
          typeof option === 'string' ? option : option.group + option.shortName
        }
        renderOptionStartIcon={(option) =>
          renderOccurrenceCount(option.attributionCount)
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
                  splitAtLastExpression(licenseName)[0] === ''
                ? option.shortName
                : `... ${option.shortName}`,
          secondary: (option) =>
            typeof option === 'string' ? null : option.fullName,
        }}
        onChange={(_, value) =>
          typeof value !== 'string' &&
          isEditable &&
          onUpdate({
            licenseName: value.replaceEntireSearch
              ? value.shortName
              : `${splitAtLastExpression(licenseName)[0]}${value.shortName}`,
            licenseText: '',
          })
        }
        onInputChange={(event, value, reason) =>
          event &&
          reason === 'input' &&
          isEditable &&
          onUpdate({ licenseName: value })
        }
        autoHighlight
        disableClearable
        freeSolo
        startAdornment={startAdornment}
        endAdornment={endAdornment}
      />
      {isEditable && (
        <SpdxValidationDisplay
          validationResult={validationResult}
          onApplyFix={(newExpression) =>
            onUpdate({ licenseName: newExpression })
          }
        />
      )}
    </MuiBox>
  );
}

type LicenseOption = {
  shortName: string;
  fullName: string | undefined;
  attributionCount?: number | [number, number];
  group: string;
  replaceEntireSearch: boolean;
};

function toLicenseOptions(
  items: Array<{ value: string; count: number }>,
  group: string,
): Array<LicenseOption> {
  return sortBy(
    items.map<LicenseOption>((item) => ({
      shortName: item.value,
      fullName: undefined,
      attributionCount: item.count,
      group,
      replaceEntireSearch: true,
    })),
    ({ attributionCount }) => -(attributionCount ?? 0),
  );
}
