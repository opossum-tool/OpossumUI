// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Fragment, ReactElement } from 'react';

import { ResourceBrowser } from '../ResourceBrowser/ResourceBrowser';
import { ResourceDetailsViewer } from '../ResourceDetailsViewer/ResourceDetailsViewer';

export function AuditView(): ReactElement {
  return (
    <Fragment>
      <ResourceBrowser />
      <ResourceDetailsViewer />
    </Fragment>
  );
}
