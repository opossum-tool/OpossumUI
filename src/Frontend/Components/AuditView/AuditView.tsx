// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttributionDetails } from '../AttributionDetails/AttributionDetails';
import { AttributionPanels } from '../AttributionPanels/AttributionPanels';
import { PathBar } from '../PathBar/PathBar';
import { ResourceBrowser } from '../ResourceBrowser/ResourceBrowser';
import { ColumnsContainer } from './AuditView.style';

export const AuditView: React.FC = () => {
  return (
    <>
      <PathBar />
      <ColumnsContainer>
        <ResourceBrowser />
        <AttributionPanels />
        <AttributionDetails />
      </ColumnsContainer>
    </>
  );
};
