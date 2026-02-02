// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from 'node:fs';

const required = readFileSync('.nvmrc', 'utf-8').trim();
const current = process.versions.node;

if (current !== required) {
  console.error(
    `Node ${required} required (you have ${current}). Your local environment needs to match the node version that is bundled with electron. See https://releases.electronjs.org/.`,
  );
  process.exit(1);
}
