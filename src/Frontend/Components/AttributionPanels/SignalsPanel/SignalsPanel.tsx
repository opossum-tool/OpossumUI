// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';

import { SIGNAL_FILTERS } from '../../../shared-constants';
import { useAttributionIdsForReplacement } from '../../../state/variables/use-attribution-ids-for-replacement';
import { useExternalAttributionFilters } from '../../../state/variables/use-filters';
import { useUserSettings } from '../../../state/variables/use-user-setting';
import { PackagesPanel } from '../PackagesPanel/PackagesPanel';
import { DeleteButton } from './DeleteButton/DeleteButton';
import { LinkButton } from './LinkButton/LinkButton';
import { RestoreButton } from './RestoreButton/RestoreButton';
import { SignalsList } from './SignalsList/SignalsList';
import { ToggleHiddenSignalsButton } from './ToggleHiddenSignalsButton/ToggleHiddenSignalsButton';

export function SignalsPanel() {
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();

  const [userSettings, updateUserSettings] = useUserSettings();
  const areHiddenSignalsVisible = userSettings.areHiddenSignalsVisible;

  return (
    <PackagesPanel
      external={true}
      availableFilters={SIGNAL_FILTERS}
      disableSelectAll={!!attributionIdsForReplacement.length}
      renderActions={(props) => (
        <>
          <LinkButton {...props} />
          <DeleteButton {...props} />
          <RestoreButton {...props} />
          <MuiBox sx={{ flex: 1 }} />
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
      useAttributionFilters={useExternalAttributionFilters}
      testId={'signals-panel'}
    >
      {(props) => <SignalsList {...props} />}
    </PackagesPanel>
  );
}
