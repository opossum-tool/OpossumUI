// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import BarChartIcon from '@mui/icons-material/BarChart';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { useMemo } from 'react';

import type { SortOption } from '../../../shared/attribution-result-set';
import { text } from '../../../shared/text';
import { useUserSettings } from '../../state/variables/use-user-setting';
import { ClassificationCIcon } from '../Icons/Icons';

interface SortIconProps {
  color?: 'action' | 'disabled' | 'inherit';
}

interface SortOptionConfiguration {
  label: string;
  icon: React.FC<SortIconProps>;
  active: boolean;
}

type SortConfiguration = Record<SortOption, SortOptionConfiguration>;

export function useSortConfiguration(): SortConfiguration {
  const [userSettings] = useUserSettings();
  const showClassifications = userSettings.showClassifications;
  const showCriticality = userSettings.showCriticality;

  return useMemo(() => {
    return {
      alphabetically: {
        label: text.sortings.name,
        icon: ({ color }: SortIconProps) => (
          <SortByAlphaIcon color={color || 'action'} fontSize={'inherit'} />
        ),
        active: true,
      },
      criticality: {
        label: text.sortings.criticality,
        icon: ({ color }: SortIconProps) => (
          <WhatshotIcon color={color || 'warning'} fontSize={'inherit'} />
        ),
        active: showCriticality,
      },
      occurrence: {
        label: text.sortings.occurrence,
        icon: ({ color }: SortIconProps) => (
          <BarChartIcon color={color || 'info'} fontSize={'inherit'} />
        ),
        active: true,
      },
      classification: {
        label: text.sortings.classification,
        icon: ({ color }: SortIconProps) => (
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
