// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { ResourceDetailsViewer } from '../ResourceDetailsViewer/ResourceDetailsViewer';
import { ResourceBrowser } from '../ResourceBrowser/ResourceBrowser';
import { ResourceDetailsTabsWorkers } from '../../web-workers/get-new-accordion-worker';

interface AuditViewProps {
  resourceDetailsTabsWorkers: ResourceDetailsTabsWorkers;
}

export function AuditView(props: AuditViewProps): ReactElement {
  return (
    <React.Fragment>
      <ResourceBrowser />
      <ResourceDetailsViewer
        resourceDetailsTabsWorkers={props.resourceDetailsTabsWorkers}
      />
    </React.Fragment>
  );
}
