#!/usr/bin/env bash

# SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
# SPDX-FileCopyrightText: TNG Technology Consulting GmbH<https://www.tngtech.com>
#
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

pr_number=""
commit_hash=""
remote_name="origin"
file_path=""
checkout_only=false:

usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "Options:"
  echo " -p, Set the number of the PR to use"
  echo " -c, Set the commit hash to use"
  echo " -n, Set the name of the remote, default: origin"
  echo " -f, Set absolute path to file which should be opened"
  echo " -o, Checkout only, don't open the app"
  echo "Note: either use -c or -p"
  echo "Note: The script assumes to be run in the root directory of a local clone of the original repo"
}

while getopts p:c:n:f:o flag; do
  case "${flag}" in
    p) pr_number=${OPTARG} ;;
    c) commit_hash=${OPTARG} ;;
    n) remote_name=${OPTARG} ;;
    f) file_path=${OPTARG} ;;
    o) checkout_only=true ;;
    *) usage ;;
  esac
done
if [[ -z "$pr_number" && -z "$commit_hash" || ! (-z "$pr_number") && ! (-z "$commit_hash") ]]; then
  usage
  exit 1
fi

# Checkout main and fetch latest changes
git checkout main
git fetch "$remote_name"

if [[ ! (-z "$pr_number") ]]; then
  echo "Checking out PR $pr_number"
  git fetch "$remote_name" "pull/$pr_number/head:pull_$pr_number"
  git checkout "pull_$pr_number"
else
  git pull
  git checkout "$commit_hash"
fi

if [[ "$checkout_only" = true ]]; then
  exit 0
fi

yarn install
yarn start "$file_path"
