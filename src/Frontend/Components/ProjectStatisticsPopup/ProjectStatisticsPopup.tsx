// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { getProjectStatisticsTableContent } from './project-statistics-popup-helper';

import React, { ReactElement } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { getExternalAttributions } from '../../state/selectors/all-views-resource-selectors';
import { ButtonText } from '../../enums/enums';
import { SortingOrder, SignalsPerSource } from '../../types/types';

export function ProjectStatisticsPopup(): ReactElement {
  const dispatch = useAppDispatch();

  const signals = Object.values(useAppSelector(getExternalAttributions));
  const sources: { [key: string]: number } = {};
  signals.forEach((signal) => {
    sources[signal.source?.name ?? ''] =
      (sources[signal.source?.name ?? ''] || 0) + 1;
  });

  const licensesForSources: { [key: string]: { [key: string]: number } } = {};
  for (const signal of signals) {
    const sourceName = signal.source?.name ?? '';
    const licenseName = signal.licenseName ?? '';

    const licenses = licensesForSources[sourceName] ?? {};
    licenses[licenseName] = (licenses[licenseName] || 0) + 1;

    licensesForSources[sourceName] = licenses;
  }

  const sourcesTableEntries: SignalsPerSource[] = [];

  for (const key in sources) {
    sourcesTableEntries.push({ source: key, numberOfEntries: sources[key] });
  }

  function close(): void {
    dispatch(closePopup());
  }
  const [order, setOrder] = React.useState<SortingOrder>('desc');
  const [orderBy, setOrderBy] =
    React.useState<keyof SignalsPerSource>('numberOfEntries');

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof SignalsPerSource
  ): void => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const content = getProjectStatisticsTableContent(
    order,
    orderBy,
    handleRequestSort,
    sourcesTableEntries
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
