// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';

export default async function globalTeardown(): Promise<void> {
  await fs.promises.rm('test-output', { recursive: true, force: true });
}
