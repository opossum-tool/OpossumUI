#!/usr/bin/env bash

# SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
# SPDX-FileCopyrightText: TNG Technology Consulting GmbH<https://www.tngtech.com>
#
# SPDX-License-Identifier: Apache-2.0

# This script is used to start the app with vite. To be able to directly open an .opossum file when starting the app
# we need to set the environment variable OPOSSUM_FILE. Arguments appended to yarn commands are only appended at
# the end, thus we need this script to set the environment variable properly.

FILE_PATH=$1

if [ -n "$FILE_PATH" ]; then
  echo "File path provided: $FILE_PATH"
fi

yarn generate-notice && cross-env OPOSSUM_FILE=$FILE_PATH yarn vite
