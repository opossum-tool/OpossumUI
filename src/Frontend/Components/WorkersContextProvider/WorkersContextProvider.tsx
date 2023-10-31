// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createContext, FC, ReactNode, useMemo } from 'react';

import { useAppSelector } from '../../state/hooks';
import {
  getAttributionBreakpoints,
  getExternalAttributions,
  getExternalAttributionsToHashes,
  getExternalData,
  getFilesWithChildren,
  getManualAttributions,
  getManualData,
  getResources,
  getResourcesToExternalAttributions,
  getResourcesToManualAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import { getResolvedExternalAttributions } from '../../state/selectors/audit-view-resource-selectors';
import { PanelAttributionData } from '../../util/get-contained-packages';
import { getNewAccordionWorkers } from '../../web-workers/get-new-accordion-workers';
import { getNewProgressBarWorkers } from '../../web-workers/get-new-progress-bar-workers';

const resourceDetailsTabsWorkers = getNewAccordionWorkers();

export const AccordionWorkersContext = createContext(
  resourceDetailsTabsWorkers,
);

export const AccordionWorkersContextProvider: FC<{
  children: ReactNode | null;
}> = ({ children }) => {
  const externalAttributionData = useAppSelector(getExternalData);
  const attributionsToHashes = useAppSelector(getExternalAttributionsToHashes);
  const manualAttributionData = useAppSelector(getManualData);

  const externalData: PanelAttributionData = useMemo(
    () => ({
      attributions: externalAttributionData.attributions,
      resourcesToAttributions: externalAttributionData.resourcesToAttributions,
      resourcesWithAttributedChildren:
        externalAttributionData.resourcesWithAttributedChildren,
    }),
    [externalAttributionData],
  );

  const manualData: PanelAttributionData = useMemo(
    () => ({
      attributions: manualAttributionData.attributions,
      resourcesToAttributions: manualAttributionData.resourcesToAttributions,
      resourcesWithAttributedChildren:
        manualAttributionData.resourcesWithAttributedChildren,
    }),
    [manualAttributionData],
  );

  useMemo(() => {
    try {
      // remove data from previous file or empty data from app just opened
      resourceDetailsTabsWorkers.containedExternalAttributionsAccordionWorker.postMessage(
        { externalData: null },
      );
      resourceDetailsTabsWorkers.containedExternalAttributionsAccordionWorker.postMessage(
        { externalData, attributionsToHashes },
      );
    } catch (error) {
      console.info('Web worker error in workers context provider: ', error);
    }
  }, [externalData, attributionsToHashes]);

  useMemo(() => {
    try {
      // remove data from previous file or empty data from app just opened
      resourceDetailsTabsWorkers.containedManualAttributionsAccordionWorker.postMessage(
        { manualData: null },
      );
      resourceDetailsTabsWorkers.containedManualAttributionsAccordionWorker.postMessage(
        { manualData },
      );
    } catch (error) {
      console.info('Web worker error in workers context provider: ', error);
    }
  }, [manualData]);

  return (
    <AccordionWorkersContext.Provider value={resourceDetailsTabsWorkers}>
      {children}
    </AccordionWorkersContext.Provider>
  );
};

const progressBarWorkers = getNewProgressBarWorkers();
export const ProgressBarWorkersContext = createContext(progressBarWorkers);

export const ProgressBarWorkersContextProvider: FC<{
  children: ReactNode | null;
}> = ({ children }) => {
  const resources = useAppSelector(getResources);
  const manualAttributions = useAppSelector(getManualAttributions);
  const externalAttributions = useAppSelector(getExternalAttributions);
  const resourcesToManualAttributions = useAppSelector(
    getResourcesToManualAttributions,
  );
  const resourcesToExternalAttributions = useAppSelector(
    getResourcesToExternalAttributions,
  );
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions,
  );
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const filesWithChildren = useAppSelector(getFilesWithChildren);

  useMemo(() => {
    try {
      progressBarWorkers.TopProgressBarWorker.postMessage({
        isCacheInitializationMessage: true,
        resources: null,
        externalAttributions: null,
        resourcesToExternalAttributions: null,
        attributionBreakpoints: null,
        filesWithChildren: null,
      });
      Object.values(progressBarWorkers).forEach((worker) => {
        worker.postMessage({
          isCacheInitializationMessage: true,
          resources,
          externalAttributions,
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
    externalAttributions,
    resourcesToExternalAttributions,
    attributionBreakpoints,
    filesWithChildren,
  ]);

  useMemo(() => {
    try {
      progressBarWorkers.TopProgressBarWorker.postMessage({
        manualAttributions: null,
        resourcesToManualAttributions: null,
        resolvedExternalAttributions: null,
      });
      Object.values(progressBarWorkers).forEach((worker) => {
        worker.postMessage({
          manualAttributions,
          resourcesToManualAttributions,
          resolvedExternalAttributions,
        });
      });
    } catch (error) {
      console.info('Web worker error in workers context provider: ', error);
    }
  }, [
    manualAttributions,
    resourcesToManualAttributions,
    resolvedExternalAttributions,
  ]);

  return (
    <ProgressBarWorkersContext.Provider value={progressBarWorkers}>
      {children}
    </ProgressBarWorkersContext.Provider>
  );
};
