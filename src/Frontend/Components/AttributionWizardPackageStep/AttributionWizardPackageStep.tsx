// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { ListWithAttributesItem } from '../../types/types';
import { ListWithAttributes } from '../ListWithAttributes/ListWithAttributes';

interface AttributionWizardPackageStepProps {
  attributedPackageNamespaces: Array<ListWithAttributesItem>;
  attributedPackageNames: Array<ListWithAttributesItem>;
  selectedPackageNamespaceId: string;
  selectedPackageNameId: string;
  handlePackageNamespaceListItemClick: (id: string) => void;
  handlePackageNameListItemClick: (id: string) => void;
}

export function AttributionWizardPackageStep(
  props: AttributionWizardPackageStepProps
): ReactElement {
  return (
    <>
      <ListWithAttributes
        listItems={props.attributedPackageNamespaces}
        selectedListItemId={props.selectedPackageNamespaceId}
        handleListItemClick={props.handlePackageNamespaceListItemClick}
        showAddNewInput={false}
        title={'Package namespace'}
      />
      <ListWithAttributes
        listItems={props.attributedPackageNames}
        selectedListItemId={props.selectedPackageNameId}
        handleListItemClick={props.handlePackageNameListItemClick}
        showAddNewInput={false}
        title={'Package name'}
      />
    </>
  );
}
