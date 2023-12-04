// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement } from 'react';

import { FrequentLicenseName } from '../../../shared/shared-types';
import { AutoComplete } from '../InputElements/AutoComplete';
import { InputElementProps } from '../InputElements/shared';

function isPresentInOptions(
  inputValue: string,
  frequentLicenseNames: Array<FrequentLicenseName>,
): boolean {
  const matchesValue = (licenseName: FrequentLicenseName): boolean =>
    licenseName.shortName === inputValue || licenseName.fullName === inputValue;
  return frequentLicenseNames.some(matchesValue);
}

function getFormattedLicenseNamesToShortNameMapping(
  frequentLicenseNames: Array<FrequentLicenseName>,
): {
  [key: string]: string;
} {
  function formatLicenseName(licenseName: FrequentLicenseName): string {
    return `${licenseName.shortName} - ${licenseName.fullName}`;
  }

  return Object.fromEntries(
    frequentLicenseNames.map((option: FrequentLicenseName) => [
      formatLicenseName(option),
      option.shortName,
    ]),
  );
}

interface LicenseFieldProps extends InputElementProps {
  frequentLicenseNames: Array<FrequentLicenseName>;
  endAdornmentText?: string;
}

export function LicenseField(props: LicenseFieldProps): ReactElement {
  const formattedLicenseNamesToShortNameMapping =
    getFormattedLicenseNamesToShortNameMapping(props.frequentLicenseNames);
  const sortedLicenses = Object.keys(
    formattedLicenseNamesToShortNameMapping,
  ).sort((license, otherLicense) =>
    license.toLowerCase() < otherLicense.toLowerCase() ? -1 : 1,
  );

  function formatOptionForDisplay(option: string): string {
    return formattedLicenseNamesToShortNameMapping[option]
      ? formattedLicenseNamesToShortNameMapping[option]
      : option;
  }

  const inputValue = props.text || '';
  const inputValueIsInOptions = isPresentInOptions(
    inputValue,
    props.frequentLicenseNames,
  );

  return (
    <AutoComplete
      isEditable={props.isEditable}
      fullWidth
      title={props.title}
      handleChange={props.handleChange}
      isHighlighted={props.isHighlighted}
      options={sortedLicenses}
      endAdornmentText={props.endAdornmentText}
      inputValue={inputValue}
      showTextBold={inputValueIsInOptions}
      formatOptionForDisplay={formatOptionForDisplay}
    />
  );
}
