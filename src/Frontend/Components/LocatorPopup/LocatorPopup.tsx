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
import { getLocatePopupSelectedCriticality } from '../../state/selectors/locate-popup-selectors';
import { setLocatePopupSelectedCriticality } from '../../state/actions/resource-actions/locate-popup-actions';
import { SelectedCriticality } from '../../../shared/shared-types';

const classes = {
  dropdown: {
    marginTop: '8px',
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

export function LocatorPopup(): ReactElement {
  const dispatch = useAppDispatch();
  function close(): void {
    dispatch(closePopup());
  }

  const selectedCriticality = useAppSelector(getLocatePopupSelectedCriticality);
  const [criticalityDropDownChoice, setCriticalityDropDownChoice] =
    useState<SelectedCriticality>(selectedCriticality);

  function handleApplyClick(): void {
    dispatch(setLocatePopupSelectedCriticality(criticalityDropDownChoice));
  }

  function handleClearClick(): void {
    setCriticalityDropDownChoice(SelectedCriticality.Any);
    dispatch(setLocatePopupSelectedCriticality(SelectedCriticality.Any));
  }

  function updateCritialityDropdownChoice(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    setCriticalityDropDownChoice(event.target.value as SelectedCriticality);
  }

  return (
    <NotificationPopup
      content={
        <Dropdown
          sx={classes.dropdown}
          isEditable={true}
          title={'Criticality'}
          value={criticalityDropDownChoice}
          menuItems={criticalityMenuItems}
          handleChange={updateCritialityDropdownChoice}
        />
      }
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
