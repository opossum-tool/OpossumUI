// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ChangeEvent, ReactElement, useState } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { ButtonText, CriticalityTypes } from '../../enums/enums';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { Dropdown, menuItem } from '../InputElements/Dropdown';
import {
  getLocatePopupSelectedCriticality,
  getLocatePopupSelectedLicenses,
} from '../../state/selectors/locate-popup-selectors';
import {
  setLocatePopupSelectedCriticality,
  setLocatePopupSelectedLicenses,
} from '../../state/actions/resource-actions/locate-popup-actions';
import {
  Attributions,
  SelectedCriticality,
} from '../../../shared/shared-types';
import { getExternalAttributions } from '../../state/selectors/all-views-resource-selectors';
import { AutoComplete } from '../InputElements/AutoComplete';
import { locateResourcesByCriticalityAndLicense } from '../../state/helpers/action-and-reducer-helpers';
import { setResourcesWithLocatedAttributions } from '../../state/actions/resource-actions/all-views-simple-actions';

const classes = {
  dropdown: {
    marginTop: '8px',
  },
  autocomplete: { marginTop: '8px' },
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
  const selectedCriticality = useAppSelector(getLocatePopupSelectedCriticality);
  const [criticalityDropDownChoice, setCriticalityDropDownChoice] =
    useState<SelectedCriticality>(selectedCriticality);
  function updateCriticalityDropdownChoice(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    setCriticalityDropDownChoice(event.target.value as SelectedCriticality);
  }
  const externalAttributions = useAppSelector(getExternalAttributions);
  const licenseNameOptions = getLicenseNames(externalAttributions);
  const selectedLicenses = useAppSelector(getLocatePopupSelectedLicenses);
  // currently we only support sets with one element
  // once we support multiple elements we will have to adapt the logic to not take one arbitrary element of the set
  const selectedLicense =
    selectedLicenses.size == 0 ? '' : selectedLicenses.values().next().value;
  const [searchedLicense, setSearchedLicense] = useState(selectedLicense);

  function handleApplyClick(): void {
    dispatch(setLocatePopupSelectedCriticality(criticalityDropDownChoice));
    dispatch(setLocatePopupSelectedLicenses(new Set([searchedLicense])));
    dispatch(
      locateResourcesByCriticalityAndLicense(
        criticalityDropDownChoice,
        new Set([searchedLicense]),
      ),
    );
  }

  function handleClearClick(): void {
    setCriticalityDropDownChoice(SelectedCriticality.Any);
    dispatch(setLocatePopupSelectedCriticality(SelectedCriticality.Any));
    setSearchedLicense('');
    dispatch(setLocatePopupSelectedLicenses(new Set()));
    dispatch(
      setResourcesWithLocatedAttributions(
        {
          paths: [],
          pathsToIndices: {},
          attributedChildren: {},
        },
        new Set(),
      ),
    );
  }
  function close(): void {
    dispatch(closePopup());
  }
  const content = (
    <>
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
          setSearchedLicense(event.target.value);
        }}
        isHighlighted={false}
        options={licenseNameOptions}
        inputValue={searchedLicense}
        showTextBold={false}
        formatOptionForDisplay={(option: string): string => option}
      />
    </>
  );
  return (
    <NotificationPopup
      content={content}
      header={'Locate Signals'}
      isOpen={true}
      fullWidth={false}
      leftButtonConfig={{
        onClick: handleClearClick,
        buttonText: ButtonText.Clear,
      }}
      centerLeftButtonConfig={{
        onClick: handleApplyClick,
        buttonText: ButtonText.Apply,
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
