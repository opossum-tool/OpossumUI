// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ChangeEvent, ReactElement, useState } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { ButtonText, CriticalityTypes } from '../../enums/enums';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { Dropdown } from '../InputElements/Dropdown';
import { SelectedCriticality } from '../../types/types';
import { getLocatePopupSelectedCriticality } from '../../state/selectors/locate-popup-selectors';
import { setLocatePopupSelectedCriticality } from '../../state/actions/resource-actions/locate-popup-actions';

const classes = {
  dropdown: {
    marginTop: '8px',
  },
};

export function LocatorPopup(): ReactElement {
  const dispatch = useAppDispatch();
  function close(): void {
    dispatch(closePopup());
  }

  const selectedCriticality = useAppSelector(getLocatePopupSelectedCriticality);
  const [criticalityDropDownChoice, setCriticalityDropDownChoice] =
    useState<SelectedCriticality>(selectedCriticality);

  return (
    <NotificationPopup
      content={
        <Dropdown
          sx={classes.dropdown}
          isEditable={true}
          title={'Criticality'}
          value={criticalityDropDownChoice}
          menuItems={[
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
          ]}
          handleChange={(event: ChangeEvent<HTMLInputElement>): void => {
            setCriticalityDropDownChoice(
              event.target.value as SelectedCriticality,
            );
          }}
        />
      }
      header={'Locate Signals'}
      isOpen={true}
      fullWidth={false}
      leftButtonConfig={{
        onClick: (): void => {
          setCriticalityDropDownChoice(SelectedCriticality.Any);
          dispatch(setLocatePopupSelectedCriticality(SelectedCriticality.Any));
        },
        buttonText: ButtonText.Clear,
      }}
      centerLeftButtonConfig={{
        onClick: (): void => {
          dispatch(
            setLocatePopupSelectedCriticality(criticalityDropDownChoice),
          );
        },
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
