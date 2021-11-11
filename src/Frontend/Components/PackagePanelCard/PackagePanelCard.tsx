// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useState } from 'react';
import { getCardLabels } from '../PackageCard/package-card-helpers';
import { PackageCard } from '../PackageCard/PackageCard';
import { ResourcePathPopup } from '../ResourcePathPopup/ResourcePathPopup';
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
  const [showAssociatedResourcesPopup, setShowAssociatedResourcesPopup] =
    useState<boolean>(false);

  return (
    <div>
      <ResourcePathPopup
        isOpen={showAssociatedResourcesPopup}
        closePopup={(): void => setShowAssociatedResourcesPopup(false)}
        attributionId={props.attributionId}
        isExternalAttribution={Boolean(props.cardConfig.isExternalAttribution)}
        displayedAttributionName={getCardLabels(props.cardContent)[0] || ''}
      />
      <PackageCard
        attributionId={props.attributionId}
        cardContent={props.cardContent}
        onClick={props.onClick}
        onIconClick={props.onIconClick}
        cardConfig={props.cardConfig}
        packageCount={props.packageCount}
        hideResourceSpecificButtons={props.hideResourceSpecificButtons}
      />
    </div>
  );
}
