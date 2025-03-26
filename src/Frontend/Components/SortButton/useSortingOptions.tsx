// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import BarChartIcon from '@mui/icons-material/BarChart';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { useMemo } from 'react';

import { text } from '../../../shared/text';
import { useUserSettings } from '../../state/variables/use-user-setting';
import { ClassificationCIcon } from '../Icons/Icons';

export type SortOption =
  | 'alphabetically'
  | 'criticality'
  | 'occurrence'
  | 'classification';

export interface SortOptionConfiguration {
  label: string;
  icon: React.FC<{ color?: 'action' | 'disabled' }>;
  active: boolean;
}

export type SortConfiguration = Record<SortOption, SortOptionConfiguration>;

export function useSortConfiguration(): SortConfiguration {
  const [userSettings] = useUserSettings();
  const showClassifications = userSettings.showClassifications;
  const showCriticality = userSettings.showCriticality;

  return useMemo(() => {
    return {
      alphabetically: {
        label: text.sortings.name,
        icon: ({ color }: { color?: 'action' | 'disabled' }) => (
          <SortByAlphaIcon color={color || 'action'} fontSize={'inherit'} />
        ),
        active: true,
      },
      criticality: {
        label: text.sortings.criticality,
        icon: ({ color }: { color?: 'action' | 'disabled' }) => (
          <WhatshotIcon color={color || 'warning'} fontSize={'inherit'} />
        ),
        active: showCriticality,
      },
      occurrence: {
        label: text.sortings.occurrence,
        icon: ({ color }: { color?: 'action' | 'disabled' }) => (
          <BarChartIcon color={color || 'info'} fontSize={'inherit'} />
        ),
        active: true,
      },
      classification: {
        label: text.sortings.classification,
        icon: ({ color }: { color?: 'action' | 'disabled' }) => (
          <ClassificationCIcon
            color={color || 'warning'}
            fontSize={'inherit'}
          />
        ),
        active: showClassifications,
      },
    };
  }, [showClassifications, showCriticality]);
}
