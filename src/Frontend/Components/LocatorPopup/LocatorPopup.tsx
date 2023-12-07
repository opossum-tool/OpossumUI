// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiAutocomplete from '@mui/material/Autocomplete';
import MuiBox from '@mui/material/Box';
import MuiTextField from '@mui/material/TextField';
import MuiTypography from '@mui/material/Typography';
import { ChangeEvent, ReactElement, useState } from 'react';

import {
  Attributions,
  SelectedCriticality,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { ButtonText, CriticalityTypes } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { locateSignalsFromLocatorPopup } from '../../state/actions/popup-actions/popup-actions';
import { setLocatePopupFilters } from '../../state/actions/resource-actions/locate-popup-actions';
import {
  closePopup,
  setShowNoSignalsLocatedMessage,
} from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getExternalAttributions } from '../../state/selectors/all-views-resource-selectors';
import {
  getLocatePopupFilters,
  getShowNoSignalsLocatedMessage,
} from '../../state/selectors/locate-popup-selectors';
import { compareAlphabeticalStrings } from '../../util/get-alphabetical-comparer';
import { Checkbox } from '../Checkbox/Checkbox';
import { Dropdown, MenuItem } from '../InputElements/Dropdown';
import { inputElementClasses } from '../InputElements/shared';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { SearchTextField } from '../SearchTextField/SearchTextField';

const classes = {
  ...inputElementClasses,
  dropdown: {
    marginTop: '8px',
  },
  autocomplete: { marginTop: '12px' },
  autocompleteInput: {
    '& .MuiInputLabel-root': {
      top: '2px',
    },
    '& .MuiInputBase-input': {
      height: '24px',
    },
    '& .MuiInputBase-root': {
      borderRadius: '0px',
    },
  },
  noSignalsMessage: { color: OpossumColors.red, marginTop: '8px' },
  dialogContent: {
    width: '25vw',
  },
  search: {
    padding: '8px',
    border: '1px solid lightgrey',
    marginBottom: '16px',
    borderRadius: '2px',
  },
};

const criticalityMenuItems: Array<MenuItem> = [
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
        />
        <Checkbox
          label={text.locatorPopup.onlySearchLicenseNames}
          checked={displaySearchOnlyLicenseName}
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
      <MuiAutocomplete
        title={'License'}
        sx={classes.autocomplete}
        multiple
        options={licenseNameOptions.sort((a, b) =>
          compareAlphabeticalStrings(a, b),
        )}
        size={'small'}
        filterSelectedOptions
        aria-label={'auto complete'}
        getOptionLabel={(option): string => option}
        value={[...searchedLicenses]}
        onChange={(_event, searchedLicenses): void => {
          setSearchedLicenses(new Set(searchedLicenses));
        }}
        renderInput={(params): ReactElement => (
          <MuiTextField
            {...params}
            label="License"
            sx={classes.autocompleteInput}
          />
        )}
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
        color: 'secondary',
      }}
      centerLeftButtonConfig={{
        onClick: handleApplyClick,
        buttonText: ButtonText.Apply,
      }}
      rightButtonConfig={{
        onClick: close,
        buttonText: ButtonText.Cancel,
        color: 'secondary',
      }}
      onBackdropClick={close}
      onEscapeKeyDown={close}
    />
  );
}
