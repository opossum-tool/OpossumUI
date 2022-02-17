// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { PackageCard } from '../PackageCard/PackageCard';
import { ListCardConfig, ListCardContent } from '../../types/types';

interface PackagePanelCardProps {
  cardContent: ListCardContent;
  packageCount?: number;
  cardConfig: ListCardConfig;
  onClick(): void;
  onIconClick?(): void;
  attributionId: string;
  hideResourceSpecificButtons?: boolean;
}

export function PackagePanelCard(props: PackagePanelCardProps): ReactElement {
  return (
    <div>
      <PackageCard
        attributionId={props.attributionId}
        cardContent={props.cardContent}
        onClick={props.onClick}
        onIconClick={props.onIconClick}
        cardConfig={props.cardConfig}
        packageCount={props.packageCount}
        hideResourceSpecificButtons={props.hideResourceSpecificButtons}
        showOpenResourcesIcon={true}
      />
    </div>
  );
}
