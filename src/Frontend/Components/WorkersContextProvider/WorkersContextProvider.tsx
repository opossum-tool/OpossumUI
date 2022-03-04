// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { FC, useMemo } from 'react';
import { useAppSelector } from '../../state/hooks';
import { getExternalData } from '../../state/selectors/all-views-resource-selectors';
import { getNewAccordionWorkers } from '../../web-workers/get-new-accordion-workers';

const resourceDetailsTabsWorkers = getNewAccordionWorkers();

export const WorkersContext = React.createContext(resourceDetailsTabsWorkers);

export const WorkersContextProvider: FC = ({ children }) => {
  const externalData = useAppSelector(getExternalData);
  useMemo(() => {
    try {
      resourceDetailsTabsWorkers.containedExternalAttributionsAccordionWorker.postMessage(
        { externalData }
      );
    } catch (error) {
      console.info('Web worker error in workers context provider: ', error);
    }
  }, [externalData]);
  return (
    <WorkersContext.Provider value={resourceDetailsTabsWorkers}>
      {children}
    </WorkersContext.Provider>
  );
};
