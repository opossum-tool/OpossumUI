// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { memo, useMemo } from 'react';

import { PackageInfo } from '../../../shared/shared-types';
import { HighlightingColor } from '../../enums/enums';
import { getCardLabels } from '../../util/get-card-labels';
import { Checkbox } from '../Checkbox/Checkbox';
import { ListCard, ListCardConfig } from '../ListCard/ListCard';
import { getRightIcons } from './PackageCard.util';

interface PackageCardProps {
  packageInfo: PackageInfo;
  cardConfig?: ListCardConfig;
  onClick?(): void;
  checkbox?: {
    checked: boolean;
    disabled?: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  };
  highlighting?: HighlightingColor;
}

export const PackageCard = memo(
  ({
    packageInfo,
    cardConfig,
    checkbox,
    highlighting,
    onClick,
  }: PackageCardProps) => {
    const packageLabels = useMemo(
      () => getCardLabels(packageInfo),
      [packageInfo],
    );
    const listCardConfig = useMemo<ListCardConfig>(
      () => ({
        criticality: packageInfo.criticality,
        excludeFromNotice: packageInfo.excludeFromNotice,
        firstParty: packageInfo.firstParty,
        followUp: packageInfo.followUp,
        isPreferred: packageInfo.preferred,
        needsReview: packageInfo.needsReview,
        wasPreferred: packageInfo.wasPreferred,
        ...cardConfig,
      }),
      [cardConfig, packageInfo],
    );
    const rightIcons = useMemo(
      () => getRightIcons(listCardConfig),
      [listCardConfig],
    );

    return (
      <MuiBox aria-label={`package card ${packageLabels[0]}`}>
        <ListCard
          text={packageLabels[0]}
          secondLineText={packageLabels[1]}
          cardConfig={listCardConfig}
          count={cardConfig?.hideCount ? undefined : packageInfo.count}
          rightIcons={rightIcons}
          leftElement={
            checkbox && (
              <Checkbox
                checked={checkbox.checked}
                disabled={checkbox.disabled}
                onChange={checkbox?.onChange}
                disableRipple
              />
            )
          }
          highlighting={highlighting}
          onClick={onClick}
        />
      </MuiBox>
    );
  },
);
