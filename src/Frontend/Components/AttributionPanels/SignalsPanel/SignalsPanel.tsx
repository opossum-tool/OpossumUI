// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';

import { SIGNAL_FILTERS } from '../../../shared-constants';
import { useAppSelector } from '../../../state/hooks';
import { getSelectedResourceId } from '../../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../../state/variables/use-attribution-ids-for-replacement';
import { useFilteredSignals } from '../../../state/variables/use-filtered-data';
import { backend } from '../../../util/backendClient';
import { PackagesPanel } from '../PackagesPanel/PackagesPanel';
import { DeleteButton } from './DeleteButton/DeleteButton';
import { IncludeExcludeButton } from './IncludeExcludeButton/IncludeExcludeButton';
import { LinkButton } from './LinkButton/LinkButton';
import { RestoreButton } from './RestoreButton/RestoreButton';
import { SignalsList } from './SignalsList/SignalsList';

export function SignalsPanel() {
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
  const selectedResourceId = useAppSelector(getSelectedResourceId);

  const [{ filters, search, selectedLicense }] = useFilteredSignals();

  const counts = backend.filterCounts.useQuery({
    external: true,
    filters,
    search,
    license: selectedLicense,
    resourcePathForRelationships: selectedResourceId,
  });

  return (
    <PackagesPanel
      filterCounts={counts.data?.sameOrDescendant}
      availableFilters={SIGNAL_FILTERS}
      disableSelectAll={!!attributionIdsForReplacement.length}
      renderActions={(props) => (
        <>
          <LinkButton {...props} />
          <DeleteButton {...props} />
          <RestoreButton {...props} />
          <MuiBox flex={1} />
          <IncludeExcludeButton />
        </>
      )}
      useFilteredData={useFilteredSignals}
      testId={'signals-panel'}
    >
      {(props) => <SignalsList {...props} />}
    </PackagesPanel>
  );
}
