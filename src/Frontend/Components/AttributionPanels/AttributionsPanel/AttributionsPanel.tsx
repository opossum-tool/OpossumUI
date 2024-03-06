// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';

import { text } from '../../../../shared/text';
import { ATTRIBUTION_FILTERS } from '../../../shared-constants';
import { OpossumColors } from '../../../shared-styles';
import { useAppSelector } from '../../../state/hooks';
import {
  getManualAttributions,
  getResourcesToManualAttributions,
  getSelectedResourceId,
} from '../../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../../state/variables/use-attribution-ids-for-replacement';
import { useFilteredAttributions } from '../../../state/variables/use-filtered-data';
import { isPackageInfoIncomplete } from '../../../util/is-important-attribution-information-missing';
import { Alert, PackagesPanel } from '../PackagesPanel/PackagesPanel';
import { AttributionsList } from './AttributionsList/AttributionsList';
import { ConfirmButton } from './ConfirmButton/ConfirmButton';
import { CreateButton } from './CreateButton/CreateButton';
import { DeleteButton } from './DeleteButton/DeleteButton';
import { LinkButton } from './LinkButton/LinkButton';
import { ReplaceButton } from './ReplaceButton/ReplaceButton';

export function AttributionsPanel() {
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const resourcesToManualAttributions = useAppSelector(
    getResourcesToManualAttributions,
  );
  const manualAttributions = useAppSelector(getManualAttributions);

  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();

  const alert = useMemo<Alert | undefined>(() => {
    if (attributionIdsForReplacement.length) {
      return {
        text: text.packageLists.selectReplacement,
        color: OpossumColors.green,
      };
    }
    if (
      resourcesToManualAttributions[selectedResourceId]?.some(
        (id) =>
          manualAttributions[id] &&
          isPackageInfoIncomplete(manualAttributions[id]),
      )
    ) {
      return {
        text: text.packageLists.incompleteAttributions,
        color: OpossumColors.lightOrange,
        textColor: OpossumColors.black,
      };
    }

    return undefined;
  }, [
    attributionIdsForReplacement.length,
    manualAttributions,
    resourcesToManualAttributions,
    selectedResourceId,
  ]);

  return (
    <PackagesPanel
      alert={alert}
      availableFilters={ATTRIBUTION_FILTERS}
      disableSelectAll={!!attributionIdsForReplacement.length}
      renderActions={(props) => (
        <>
          <CreateButton {...props} />
          <LinkButton {...props} />
          <ConfirmButton {...props} />
          <ReplaceButton {...props} />
          <DeleteButton {...props} />
        </>
      )}
      useFilteredData={useFilteredAttributions}
      testId={'attributions-panel'}
    >
      {(props) => <AttributionsList {...props} />}
    </PackagesPanel>
  );
}
