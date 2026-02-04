// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, rmSync } from 'fs';

export default function setup() {
  mkdirSync('test-output', { recursive: true });

  // Return teardown function
  return () => {
    rmSync('test-output', { recursive: true, force: true });
  };
}
