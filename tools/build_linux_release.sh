#!/usr/bin/env bash

# SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
# SPDX-FileCopyrightText: TNG Technology Consulting GmbH<https://www.tngtech.com>
#
# SPDX-License-Identifier: Apache-2.0

set -e

NODE_OPTIONS=--no-deprecation electron-builder --linux --x64 --publish never
