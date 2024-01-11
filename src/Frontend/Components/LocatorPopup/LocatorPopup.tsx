// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { compact, sortBy, uniq } from 'lodash';
import { ChangeEvent, ReactElement, useMemo, useState } from 'react';

import { SelectedCriticality } from '../../../shared/shared-types';
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
import { Autocomplete } from '../Autocomplete/Autocomplete';
import { Checkbox } from '../Checkbox/Checkbox';
import { Dropdown, MenuItem } from '../InputElements/Dropdown';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { SearchTextField } from '../SearchTextField/SearchTextField';

const classes = {
  dropdown: {
    marginTop: '8px',
  },
  autocomplete: { marginTop: '12px' },
  noSignalsMessage: { color: OpossumColors.red, marginTop: '8px' },
  dialogContent: {
    width: '400px',
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

  const licenseNameOptions = useMemo(
    () =>
      sortBy(
        compact(
          uniq(
            Object.values(externalAttributions).map(
              ({ licenseName }) => licenseName,
            ),
          ),
        ),
        (licenseName) => licenseName.toLowerCase(),
      ),
    [externalAttributions],
  );

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
      <Autocomplete
        sx={classes.autocomplete}
        options={licenseNameOptions}
        optionText={{ primary: (option) => option }}
        multiple
        title={text.locatorPopup.license}
        value={[...searchedLicenses]}
        onChange={(_, value) => {
          setSearchedLicenses(new Set(value));
        }}
        filterSelectedOptions
        aria-label={'license names'}
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
