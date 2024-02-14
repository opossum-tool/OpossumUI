// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { memo, useMemo } from 'react';

import { PackageInfo } from '../../../shared/shared-types';
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
}

export const PackageCard = memo(
  ({ packageInfo, cardConfig, checkbox, onClick }: PackageCardProps) => {
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
        preSelected: packageInfo.preSelected,
        preferred: packageInfo.preferred,
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
      <ListCard
        text={packageLabels[0]}
        secondLineText={packageLabels[1]}
        cardConfig={listCardConfig}
        count={packageInfo.count}
        rightIcons={rightIcons}
        onClick={onClick}
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
      />
    );
  },
);
