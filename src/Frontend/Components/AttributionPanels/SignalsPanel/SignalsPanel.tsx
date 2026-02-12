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
import { useUserSettings } from '../../../state/variables/use-user-setting';
import { backend } from '../../../util/backendClient';
import { PackagesPanel } from '../PackagesPanel/PackagesPanel';
import { DeleteButton } from './DeleteButton/DeleteButton';
import { LinkButton } from './LinkButton/LinkButton';
import { RestoreButton } from './RestoreButton/RestoreButton';
import { SignalsList } from './SignalsList/SignalsList';
import { ToggleHiddenSignalsButton } from './ToggleHiddenSignalsButton/ToggleHiddenSignalsButton';

export function SignalsPanel() {
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
  const selectedResourceId = useAppSelector(getSelectedResourceId);

  const [userSettings, updateUserSettings] = useUserSettings();
  const areHiddenSignalsVisible = userSettings.areHiddenSignalsVisible;

  const [{ filters, search, selectedLicense }] = useFilteredSignals();

  const counts = backend.filterCounts.useQuery({
    external: true,
    filters,
    search,
    license: selectedLicense,
    resourcePathForRelationships: selectedResourceId,
    showResolved: areHiddenSignalsVisible,
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
          <ToggleHiddenSignalsButton
            showHiddenSignals={areHiddenSignalsVisible}
            setShowHiddenSignals={(showHiddenSignals) =>
              updateUserSettings(() => ({
                areHiddenSignalsVisible: showHiddenSignals,
              }))
            }
          />
        </>
      )}
      useFilteredData={useFilteredSignals}
      testId={'signals-panel'}
    >
      {(props) => <SignalsList {...props} />}
    </PackagesPanel>
  );
}
