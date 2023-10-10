#!/usr/bin/env bash

# SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
# SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
#
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

cd "$( dirname "${BASH_SOURCE[0]}" )"

echo "linter"
echo "-----------------------"
yarn lint

echo "type checking"
echo "-----------------------"
yarn typecheck

echo "copyright checking"
echo "-----------------------"
yarn copyright-lint-check
