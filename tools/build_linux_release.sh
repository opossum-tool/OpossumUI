#!/usr/bin/env bash

# SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
# SPDX-FileCopyrightText: TNG Technology Consulting GmbH<https://www.tngtech.com>
#
# SPDX-License-Identifier: Apache-2.0

set -e

electron-builder --linux --x64 --publish never
mkdir -p release/linux
mv 'release/opossum-ui_0.1.0_amd64.snap' 'release/linux/OpossumUI-for-linux.snap'
mv 'release/OpossumUI-0.1.0.AppImage' 'release/linux/OpossumUI-for-linux.AppImage'
