// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Checkbox } from '../Checkbox/Checkbox';
import React, { ChangeEvent, ReactElement, useState } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import {
  closePopup,
  setShowNoSignalsLocatedMessage,
} from '../../state/actions/view-actions/view-actions';
import { ButtonText, CheckboxLabel, CriticalityTypes } from '../../enums/enums';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { Dropdown, menuItem } from '../InputElements/Dropdown';
import {
  getLocatePopupFilters,
  getShowNoSignalsLocatedMessage,
} from '../../state/selectors/locate-popup-selectors';
import { setLocatePopupFilters } from '../../state/actions/resource-actions/locate-popup-actions';
import {
  Attributions,
  SelectedCriticality,
} from '../../../shared/shared-types';
import { getExternalAttributions } from '../../state/selectors/all-views-resource-selectors';
import { AutoComplete } from '../InputElements/AutoComplete';
import { OpossumColors } from '../../shared-styles';
import MuiTypography from '@mui/material/Typography';
import { compareAlphabeticalStrings } from '../../util/get-alphabetical-comparer';
import { locateSignalsFromLocatorPopup } from '../../state/actions/popup-actions/popup-actions';
import { SearchTextField } from '../SearchTextField/SearchTextField';
import MuiBox from '@mui/material/Box';

const classes = {
  dropdown: {
    marginTop: '8px',
  },
  autocomplete: { marginTop: '12px' },
  noSignalsMessage: { color: OpossumColors.red, marginTop: '8px' },
  dialogContent: {
    width: '25vw',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  search: {
    padding: '8px',
    border: '1px solid lightgrey',
    marginBottom: '16px',
    borderRadius: '2px',
  },
};

const criticalityMenuItems: Array<menuItem> = [
  {
    value: SelectedCriticality.High,
    name: CriticalityTypes.HighCriticality,
  },
  {
    value: SelectedCriticality.Medium,
    name: CriticalityTypes.MediumCriticality,
  },
  {
    value: SelectedCriticality.Any,
    name: CriticalityTypes.AnyCriticality,
  },
];

// exported for testing
export function getLicenseNames(attributions: Attributions): Array<string> {
  const licenseNames: Set<string> = new Set();
  for (const attribution of Object.values(attributions)) {
    const licenseName = attribution.licenseName;
    if (licenseName) {
      licenseNames.add(licenseName);
    }
  }
  return Array.from(licenseNames.values());
}

export function LocatorPopup(): ReactElement {
  const dispatch = useAppDispatch();
  const externalAttributions = useAppSelector(getExternalAttributions);
  const {
    selectedCriticality,
    selectedLicenses,
    searchTerm,
    searchOnlyLicenseName,
  } = useAppSelector(getLocatePopupFilters);
  const showNoSignalsLocatedMessage = useAppSelector(
    getShowNoSignalsLocatedMessage,
  );

  const licenseNameOptions = getLicenseNames(externalAttributions);

  const [searchedLicenses, setSearchedLicenses] = useState(selectedLicenses);

  const [searchedSignal, setSearchedSignal] = useState(searchTerm);
  const [displaySearchOnlyLicenseName, setDisplaySearchOnlyLicenseName] =
    useState(searchOnlyLicenseName);
  const [criticalityDropDownChoice, setCriticalityDropDownChoice] =
    useState<SelectedCriticality>(selectedCriticality);

  function updateCriticalityDropdownChoice(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    setCriticalityDropDownChoice(event.target.value as SelectedCriticality);
  }

  function handleApplyClick(): void {
    dispatch(
      locateSignalsFromLocatorPopup(
        criticalityDropDownChoice,
        searchedLicenses,
        searchedSignal,
        displaySearchOnlyLicenseName,
      ),
    );
  }

  function handleClearClick(): void {
    setCriticalityDropDownChoice(SelectedCriticality.Any);
    setSearchedLicenses(new Set());
    setSearchedSignal('');
    setDisplaySearchOnlyLicenseName(false);
    dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Any,
        selectedLicenses: new Set<string>(),
        searchTerm: '',
        searchOnlyLicenseName: false,
      }),
    );
    dispatch(setShowNoSignalsLocatedMessage(false));
  }

  function close(): void {
    dispatch(closePopup());
  }

  const content = (
    <>
      <MuiBox sx={classes.search}>
        <SearchTextField
          sx={classes.autocomplete}
          onInputChange={(search: string): void => {
            setSearchedSignal(search);
          }}
          search={searchedSignal}
          showIcon={true}
        />
        <Checkbox
          sx={classes.checkboxContainer}
          label={CheckboxLabel.OnlyLicenseName}
          checked={displaySearchOnlyLicenseName}
          disabled={searchedSignal === ''}
          onChange={(): void => {
            setDisplaySearchOnlyLicenseName(!displaySearchOnlyLicenseName);
          }}
        />
      </MuiBox>
      <Dropdown
        sx={classes.dropdown}
        isEditable={true}
        title={'Criticality'}
        value={criticalityDropDownChoice}
        menuItems={criticalityMenuItems}
        handleChange={updateCriticalityDropdownChoice}
      />
      <AutoComplete
        isEditable={true}
        sx={classes.autocomplete}
        title={'License'}
        handleChange={(event: ChangeEvent<HTMLInputElement>): void => {
          const values =
            typeof event.target.value === 'string'
              ? new Set([event.target.value])
              : new Set(event.target.value as Array<string>);
          setSearchedLicenses(values);
        }}
        isHighlighted={false}
        options={licenseNameOptions.sort((a, b) =>
          compareAlphabeticalStrings(a, b),
        )}
        value={[...searchedLicenses]}
        showTextBold={false}
        multiple={true}
        formatOptionForDisplay={(option: string): string => option}
      />
      {showNoSignalsLocatedMessage ? (
        <MuiTypography variant={'subtitle2'} sx={classes.noSignalsMessage}>
          No signals located. Please adjust filters or cancel.
        </MuiTypography>
      ) : (
        <></>
      )}
    </>
  );

  return (
    <NotificationPopup
      content={content}
      header={'Locate Signals'}
      isOpen={true}
      fullWidth={false}
      contentSx={classes.dialogContent}
      leftButtonConfig={{
        onClick: handleClearClick,
        buttonText: ButtonText.Clear,
      }}
      centerLeftButtonConfig={{
        onClick: handleApplyClick,
        buttonText: ButtonText.Apply,
        isDark: true,
      }}
      rightButtonConfig={{
        onClick: close,
        buttonText: ButtonText.Cancel,
      }}
      onBackdropClick={close}
      onEscapeKeyDown={close}
    />
  );
}
