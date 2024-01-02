// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';

export default async function globalSetup(): Promise<void> {
  await fs.promises.mkdir('test-output', { recursive: true });
}
