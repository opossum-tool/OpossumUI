#!/usr/bin/env bash

# SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
# SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
#
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

curr_branch=$(git rev-parse --abbrev-ref HEAD)
commit=$(git rev-parse --short HEAD)
echo "Current branch is $curr_branch"

echo "Building the application."
sudo dpkg --add-architecture i386 && sudo apt-get update && sudo apt-get install wine wine32
yarn ship-linux
yarn ship-mac
yarn ship-win
cd release/macOS/
zip -r -q "OpossumUI-mac.zip" "OpossumUI-darwin-x64/"
mkdir "/home/circleci/project/release/builds"
mv "/home/circleci/project/release/linux_and_windows/OpossumUI-0.1.0.AppImage" "/home/circleci/project/release/builds/OpossumUI-linux-${commit}.AppImage"
mv "/home/circleci/project/release/macOS/OpossumUI-mac.zip" "/home/circleci/project/release/builds/OpossumUI-mac-${commit}.zip"
mv "/home/circleci/project/release/linux_and_windows/OpossumUI Setup 0.1.0.exe" "/home/circleci/project/release/builds/OpossumUI-windows-${commit}.exe"
test -e "/home/circleci/project/release/builds/OpossumUI-linux-${commit}.AppImage"
test -e "/home/circleci/project/release/builds/OpossumUI-mac-${commit}.zip"
test -e "/home/circleci/project/release/builds/OpossumUI-windows-${commit}.exe"
