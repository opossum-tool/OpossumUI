// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { useMemo } from 'react';

import { text } from '../../../../shared/text';
import { SIGNAL_FILTERS } from '../../../shared-constants';
import { OpossumColors } from '../../../shared-styles';
import { useExternalAttributionFilters } from '../../../state/variables/use-filters';
import { usePickerMode } from '../../../state/variables/use-picker-mode';
import { useUserSettings } from '../../../state/variables/use-user-setting';
import { type Alert, PackagesPanel } from '../PackagesPanel/PackagesPanel';
import { DeleteButton } from './DeleteButton/DeleteButton';
import { LinkButton } from './LinkButton/LinkButton';
import { RestoreButton } from './RestoreButton/RestoreButton';
import { SignalsList } from './SignalsList/SignalsList';
import { ToggleHiddenSignalsButton } from './ToggleHiddenSignalsButton/ToggleHiddenSignalsButton';

export function SignalsPanel() {
  const [userSettings, updateUserSettings] = useUserSettings();
  const areHiddenSignalsVisible = userSettings.areHiddenSignalsVisible;
  const pickerMode = usePickerMode();

  const alert = useMemo<Alert | undefined>(() => {
    if (pickerMode.mode === 'compare') {
      return {
        text: text.packageLists.selectComparisonSignal,
        color: OpossumColors.green,
      };
    }

    return undefined;
  }, [pickerMode.mode]);

  return (
    <PackagesPanel
      external={true}
      alert={alert}
      availableFilters={SIGNAL_FILTERS}
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
