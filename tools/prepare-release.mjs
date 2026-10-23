// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  assertNewerThanPublished,
  compareVersions,
  MAX_REVISION,
  versionParts,
} from './release-version.mjs';

export default async function prepareRelease({ github, context, core }) {
  const repo = context.repo;
  const releases = await github.paginate(github.rest.repos.listReleases, {
    ...repo,
    per_page: 100,
  });
  const marker = `<!-- opossum-release-run:${context.runId} -->`;
  const matches = releases.filter((release) => release.body?.includes(marker));
  if (matches.length > 1) {
    throw new Error('Multiple releases belong to this run');
  }
  let release = matches[0];
  if (!release) {
    const prefix = `OpossumUI-${new Date().toISOString().split('T')[0]}`;
    const tags = await github.paginate(github.rest.repos.listTags, {
      ...repo,
      per_page: 100,
    });
    const occupied = [
      ...tags.map((tag) => tag.name),
      ...releases.map((item) => item.tag_name),
    ];
    const revisions = occupied
      .filter((tag) => tag === prefix || tag.startsWith(`${prefix}.`))
      .map(versionParts)
      .filter(Boolean)
      .map((parts) => parts[2]);
    const revision = revisions.length ? Math.max(...revisions) + 1 : 0;
    if (revision > MAX_REVISION) {
      throw new Error('Daily release revision limit reached');
    }
    const tag = `${prefix}${revision ? `.${revision}` : ''}`;
    assertNewerThanPublished(tag, releases);

    const previousStable = releases
      .filter((item) => !item.draft && !item.prerelease)
      .map((item) => ({
        tag: item.tag_name,
        version: versionParts(item.tag_name),
      }))
      .filter((item) => item.version)
      .sort((left, right) => compareVersions(right.version, left.version))[0];
    const { data: notes } = await github.rest.repos.generateReleaseNotes({
      ...repo,
      tag_name: tag,
      target_commitish: context.sha,
      ...(previousStable && { previous_tag_name: previousStable.tag }),
    });
    ({ data: release } = await github.rest.repos.createRelease({
      ...repo,
      tag_name: tag,
      target_commitish: context.sha,
      name: tag,
      draft: true,
      body: `${notes.body}\n\n${marker}`,
    }));
  }
  const sha = release.target_commitish;
  if (!/^[a-f0-9]{40}$/.test(sha)) {
    throw new Error('Release is missing its pinned commit SHA');
  }
  const version = versionParts(release.tag_name);
  if (!version) {
    throw new Error('Release has an invalid tag');
  }
  // Persist the draft first so retries recover after either API call fails.
  let tagCommit;
  try {
    ({ data: tagCommit } = await github.rest.repos.getCommit({
      ...repo,
      ref: release.tag_name,
    }));
  } catch (error) {
    const notFound = 404;
    if (error.status !== notFound) {
      throw error;
    }
    await github.rest.git.createRef({
      ...repo,
      ref: `refs/tags/${release.tag_name}`,
      sha,
    });
    ({ data: tagCommit } = await github.rest.repos.getCommit({
      ...repo,
      ref: release.tag_name,
    }));
  }
  if (tagCommit.sha !== sha) {
    throw new Error('Release tag no longer points to the pinned commit');
  }
  core.setOutput('tag', release.tag_name);
  core.setOutput('version', version.join('.'));
  core.setOutput('sha', sha);
  core.setOutput('published', String(!release.draft));
}
