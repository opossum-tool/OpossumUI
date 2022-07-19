// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { ButtonText } from '../../enums/enums';
import {
  getExternalAttributions,
  getExternalAttributionSources,
} from '../../state/selectors/all-views-resource-selectors';
import {
  aggregateLicensesAndSourcesFromSignals,
  getProjectStatisticsTable,
} from './project-statistics-popup-helpers';

export function ProjectStatisticsPopup(): ReactElement {
  const dispatch = useAppDispatch();

  const signals = Object.values(useAppSelector(getExternalAttributions));
  const attributionSources = useAppSelector(getExternalAttributionSources);

  const [signalCountPerSourcePerLicense, licenseNames] =
    aggregateLicensesAndSourcesFromSignals(signals, attributionSources);

  function close(): void {
    dispatch(closePopup());
  }

  const content = getProjectStatisticsTable(
    signalCountPerSourcePerLicense,
    licenseNames
  );

  return (
    <NotificationPopup
      content={content}
      header={'Project Statistics'}
      isOpen={true}
      fullWidth={true}
      rightButtonConfig={{
        onClick: close,
        buttonText: ButtonText.Close,
      }}
      onBackdropClick={close}
      onEscapeKeyDown={close}
    />
  );
}
