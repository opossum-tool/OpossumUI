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
import {
  getExternalAttributions,
  getExternalAttributionsToResources,
  getFrequentLicensesNameOrder,
} from '../../state/selectors/all-views-resource-selectors';
import { AutoComplete } from '../InputElements/AutoComplete';
import { setResourcesWithLocatedAttributions } from '../../state/actions/resource-actions/all-views-simple-actions';
import { getParents } from '../../state/helpers/get-parents';
import { OpossumColors } from '../../shared-styles';
import MuiTypography from '@mui/material/Typography';

const classes = {
  dropdown: {
    marginTop: '8px',
  },
  autocomplete: { marginTop: '12px' },
  noSignalsMessage: { color: OpossumColors.red, marginTop: '8px' },
  dialogContent: {
    width: '25vw',
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
  const selectedCriticality = useAppSelector(getLocatePopupSelectedCriticality);
  const externalAttributions = useAppSelector(getExternalAttributions);
  const selectedLicenses = useAppSelector(getLocatePopupSelectedLicenses);
  const attributionsToResources = useAppSelector(
    getExternalAttributionsToResources,
  );
  const frequentLicensesNameOrder = useAppSelector(
    getFrequentLicensesNameOrder,
  );

  const licenseNameOptions = getLicenseNames(externalAttributions);
  // currently we only support sets with one element
  // once we support multiple elements we will have to adapt the logic to not take one arbitrary element of the set
  const selectedLicense: string =
    selectedLicenses.size == 0 ? '' : selectedLicenses.values().next().value;

  const [searchedLicense, setSearchedLicense] = useState(selectedLicense);
  const [criticalityDropDownChoice, setCriticalityDropDownChoice] =
    useState<SelectedCriticality>(selectedCriticality);
  const [showNoSignalsLocatedMessage, setShowNoSignalsLocatedMessage] =
    useState<boolean>(false);

  function updateCriticalityDropdownChoice(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    setCriticalityDropDownChoice(event.target.value as SelectedCriticality);
  }

  function handleApplyClick(): void {
    const searchedLicenses =
      searchedLicense.length == 0
        ? new Set<string>()
        : new Set([searchedLicense]);
    dispatch(setLocatePopupSelectedCriticality(criticalityDropDownChoice));
    dispatch(setLocatePopupSelectedLicenses(searchedLicenses));

    const locatedResources = getResourcesWithLocatedAttributions(
      criticalityDropDownChoice,
      searchedLicenses,
    );
    const resourcesWithLocatedChildren =
      getResourcesWithLocatedChildren(locatedResources);
    dispatch(
      setResourcesWithLocatedAttributions(
        resourcesWithLocatedChildren,
        locatedResources,
      ),
    );

    const noSignalsAreFound =
      locatedResources.size === 0 && resourcesWithLocatedChildren.size === 0;
    const allFiltersAreEmpty =
      criticalityDropDownChoice === SelectedCriticality.Any &&
      searchedLicenses.size === 0;
    if (noSignalsAreFound && !allFiltersAreEmpty) {
      setShowNoSignalsLocatedMessage(true);
    } else {
      close();
    }
  }

  function getResourcesWithLocatedAttributions(
    criticality: SelectedCriticality,
    licenseNames: Set<string>,
  ): Set<string> {
    completeFrequentLicenseNamesIfPresent(licenseNames);
    const locatedResources = new Set<string>();

    const licenseIsSet = licenseNames.size > 0;
    const criticalityIsSet = criticality != SelectedCriticality.Any;
    if (!licenseIsSet && !criticalityIsSet) {
      return locatedResources;
    }
    for (const attributionId in externalAttributions) {
      const attribution = externalAttributions[attributionId];
      const licenseMatches =
        attribution.licenseName !== undefined &&
        licenseNames.has(attribution.licenseName);
      const criticalityMatches = attribution.criticality == criticality;

      if (
        (licenseMatches || !licenseIsSet) &&
        (criticalityMatches || !criticalityIsSet)
      ) {
        attributionsToResources[attributionId].forEach((resource) => {
          locatedResources.add(resource);
        });
      }
    }

    return locatedResources;
  }

  function completeFrequentLicenseNamesIfPresent(
    licenseNames: Set<string>,
  ): void {
    // if one of the license names matches a frequent license, we want to consider the short- and the full name
    for (const frequentLicense of frequentLicensesNameOrder) {
      if (licenseNames.has(frequentLicense.shortName)) {
        licenseNames.add(frequentLicense.fullName);
      } else if (licenseNames.has(frequentLicense.fullName)) {
        licenseNames.add(frequentLicense.shortName);
      }
    }
  }

  function getResourcesWithLocatedChildren(
    locatedResources: Set<string>,
  ): Set<string> {
    const resourcesWithLocatedChildren = new Set<string>();
    for (const locatedResource of locatedResources) {
      const parents = getParents(locatedResource);
      parents.forEach((parent) => resourcesWithLocatedChildren.add(parent));
    }
    return resourcesWithLocatedChildren;
  }

  function handleClearClick(): void {
    setCriticalityDropDownChoice(SelectedCriticality.Any);
    dispatch(setLocatePopupSelectedCriticality(SelectedCriticality.Any));
    setSearchedLicense('');
    dispatch(setLocatePopupSelectedLicenses(new Set()));
    setShowNoSignalsLocatedMessage(false);
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
