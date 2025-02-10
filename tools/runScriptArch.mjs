// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { execSync } from 'child_process';
import * as os from 'os';

const command = process.argv[2];
const arch = os.arch();

execSync(`yarn ${command}:${arch}`);
