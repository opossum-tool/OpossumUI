// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { ListWithAttributesItem } from '../../types/types';
import { ListWithAttributes } from '../ListWithAttributes/ListWithAttributes';

interface AttributionWizardVersionStepProps {
  packageVersionListItems: Array<ListWithAttributesItem>;
  highlightedPackageNameIds: Array<string>;
  selectedPackageNamespaceId: string;
  selectedPackageNameId: string;
  selectedPackageVersionId: string;
  handlePackageVersionListItemClick: (id: string) => void;
}

// TODO: selectedPackageNamespaceId and selectedPackageNameId already in props for upcoming ticket

export function AttributionWizardVersionStep(
  props: AttributionWizardVersionStepProps
): ReactElement {
  return (
    <ListWithAttributes
      listItems={props.packageVersionListItems}
      selectedListItemId={props.selectedPackageVersionId}
      highlightedAttributeIds={props.highlightedPackageNameIds}
      handleListItemClick={props.handlePackageVersionListItemClick}
      showAddNewInput={false}
      title={'Package version'}
      listItemSx={{ maxWidth: '400px' }}
    />
  );
}
