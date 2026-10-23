// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { assertNewerThanPublished } from './release-version.mjs';

export default async function publishRelease({ github, context, core }) {
  const repo = context.repo;
  const releases = await github.paginate(github.rest.repos.listReleases, {
    ...repo,
    per_page: 100,
  });
  const release = releases.find(
    (item) => item.tag_name === process.env.RELEASE_TAG,
  );
  if (!release) {
    throw new Error('Prepared release no longer exists');
  }
  if (!release.draft) {
    core.info('Release is already published; nothing to replace.');
    return;
  }
  if (
    !release.body?.includes(`<!-- opossum-release-run:${context.runId} -->`) ||
    release.target_commitish !== process.env.RELEASE_SHA
  ) {
    throw new Error('Release ownership or pinned commit changed');
  }
  const { data: commit } = await github.rest.repos.getCommit({
    ...repo,
    ref: release.tag_name,
  });
  if (commit.sha !== process.env.RELEASE_SHA) {
    throw new Error('Release tag changed');
  }
  assertNewerThanPublished(release.tag_name, releases);
  await github.rest.repos.updateRelease({
    ...repo,
    release_id: release.id,
    draft: false,
    make_latest: 'true',
  });
}
