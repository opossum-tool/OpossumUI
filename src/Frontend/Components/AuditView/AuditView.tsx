// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttributionColumn } from '../AttributionColumn/AttributionColumn';
import { PackageLists } from '../PackageLists/PackageLists';
import { PathBar } from '../PathBar/PathBar';
import { ResourceBrowser } from '../ResourceBrowser/ResourceBrowser';
import { Container } from './AuditView.style';

export function AuditView() {
  return (
    <>
      <PathBar />
      <Container>
        <ResourceBrowser />
        <PackageLists />
        <AttributionColumn />
      </Container>
    </>
  );
}
