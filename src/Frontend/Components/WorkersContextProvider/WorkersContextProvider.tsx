// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { FC, ReactNode, useMemo } from 'react';
import { useAppSelector } from '../../state/hooks';
import {
  getAttributionBreakpoints,
  getExternalData,
  getFilesWithChildren,
  getResources,
  getResourcesToExternalAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import { getNewAccordionWorkers } from '../../web-workers/get-new-accordion-workers';
import { getNewProgressBarWorkers } from '../../web-workers/get-new-progress-bar-workers';
import { PanelAttributionData } from '../../util/get-contained-packages';

const resourceDetailsTabsWorkers = getNewAccordionWorkers();

export const AccordionWorkersContext = React.createContext(
  resourceDetailsTabsWorkers
);

export const AccordionWorkersContextProvider: FC<{
  children: ReactNode | null;
}> = ({ children }) => {
  const externalAttributionData = useAppSelector(getExternalData);

  const externalData: PanelAttributionData = useMemo(
    () => ({
      attributions: externalAttributionData.attributions,
      resourcesToAttributions: externalAttributionData.resourcesToAttributions,
      resourcesWithAttributedChildren:
        externalAttributionData.resourcesWithAttributedChildren,
    }),
    [externalAttributionData]
  );

  useMemo(() => {
    try {
      // remove data from previous file or empty data from app just opened
      resourceDetailsTabsWorkers.containedExternalAttributionsAccordionWorker.postMessage(
        { externalData: null }
      );
      resourceDetailsTabsWorkers.containedExternalAttributionsAccordionWorker.postMessage(
        { externalData }
      );
    } catch (error) {
      console.info('Web worker error in workers context provider: ', error);
    }
  }, [externalData]);

  return (
    <AccordionWorkersContext.Provider value={resourceDetailsTabsWorkers}>
      {children}
    </AccordionWorkersContext.Provider>
  );
};

const progressBarWorkers = getNewProgressBarWorkers();
export const ProgressBarWorkersContext =
  React.createContext(progressBarWorkers);

export const ProgressBarWorkersContextProvider: FC<{
  children: ReactNode | null;
}> = ({ children }) => {
  const resources = useAppSelector(getResources);
  const resourcesToExternalAttributions = useAppSelector(
    getResourcesToExternalAttributions
  );
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const filesWithChildren = useAppSelector(getFilesWithChildren);

  useMemo(() => {
    try {
      Object.values(progressBarWorkers).forEach((worker) => {
        worker.postMessage({
          resources,
          resourcesToExternalAttributions,
          attributionBreakpoints,
          filesWithChildren,
        });
      });
    } catch (error) {
      console.info('Web worker error in workers context provider: ', error);
    }
  }, [
    resources,
    resourcesToExternalAttributions,
    attributionBreakpoints,
    filesWithChildren,
  ]);

  return (
    <ProgressBarWorkersContext.Provider value={progressBarWorkers}>
      {children}
    </ProgressBarWorkersContext.Provider>
  );
};
