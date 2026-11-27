// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttributionPanels } from '../AttributionPanels/AttributionPanels';
import { PathBar } from '../PathBar/PathBar';
import { ResourceBrowser } from '../ResourceBrowser/ResourceBrowser';
import {
  DetailsColumn,
  PanelColumns,
} from '../workspace-layout/workspace-layout';
import { AuditAttributionDetails } from './audit-attribution-details';

export const AuditView: React.FC = () => {
  return (
    <>
      <PathBar />
      <PanelColumns>
        <ResourceBrowser />
        <AttributionPanels />
        <DetailsColumn>
          <AuditAttributionDetails />
        </DetailsColumn>
      </PanelColumns>
    </>
  );
};
