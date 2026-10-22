// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app, BrowserWindow, net } from 'electron';
import log from 'electron-log';

import commitInfo from '../../commitInfo.json';
import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import {
  getReleaseAssetDownloadUrl,
  UPDATE_ASSET_NAMES,
} from '../../shared/release-assets';
import { OPOSSUM_UI_GITHUB_URL } from '../../shared/shared-constants';
import type { UpdateState } from '../../shared/shared-types';

const PREPARING_RETRY_MS = 600_000;
const CHECK_INTERVAL_MS = 3_600_000;
const REQUEST_TIMEOUT_MS = 30_000;
const API_ENDPOINT =
  'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest';
const RELEASE_TAG = /^OpossumUI-(\d{4})-(\d{2})-(\d{2})(?:\.(\d+))?$/;

interface ParsedTag {
  day: number;
  month: number;
  revision: number;
  year: number;
}

type InternalUpdateResult =
  | Exclude<UpdateState, { status: 'checking' }>
  | {
      status: 'preparing';
      installedTag: string;
    };

interface InstalledRelease {
  tag: string;
  version: ParsedTag;
}

interface GithubRelease {
  assets: Array<{
    browser_download_url: string;
    name: string;
    size: number;
    state: string;
  }>;
  draft: boolean;
  prerelease: boolean;
  tag_name: string;
}

const installedTag = commitInfo.commitInfo;
const installedVersion = parseReleaseTag(installedTag);
const installedRelease: InstalledRelease | undefined = installedVersion
  ? { tag: installedTag, version: installedVersion }
  : undefined;

let currentState: UpdateState = { status: 'checking' };
let inFlightRequest: Promise<UpdateState> | undefined;
let checkTimeout: ReturnType<typeof setTimeout> | undefined;
let automaticChecksEnabled = false;

export function parseReleaseTag(tag: string): ParsedTag | undefined {
  const match = RELEASE_TAG.exec(tag);
  if (!match) {
    return undefined;
  }
  const [, yearValue, monthValue, dayValue, revisionValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  return { year, month, day, revision: Number(revisionValue ?? 0) };
}

export function compareReleaseTags(left: ParsedTag, right: ParsedTag): number {
  return (
    left.year - right.year ||
    left.month - right.month ||
    left.day - right.day ||
    left.revision - right.revision
  );
}

export function selectRequiredAsset(
  platform: NodeJS.Platform,
  architecture: string,
  runningUnderArm64Translation: boolean,
  environment: NodeJS.ProcessEnv,
): string | undefined {
  if (platform === 'win32') {
    return UPDATE_ASSET_NAMES.windows;
  }
  if (platform === 'darwin') {
    return architecture === 'arm64' || runningUnderArm64Translation
      ? UPDATE_ASSET_NAMES.macArm64
      : UPDATE_ASSET_NAMES.macIntel;
  }
  if (platform === 'linux') {
    if (environment.SNAP) {
      return UPDATE_ASSET_NAMES.linuxSnap;
    }
    if (environment.APPIMAGE) {
      return UPDATE_ASSET_NAMES.linuxAppImage;
    }
  }
  return undefined;
}

function getRequiredAsset(): string | undefined {
  return selectRequiredAsset(
    process.platform,
    process.arch,
    app.runningUnderARM64Translation,
    process.env,
  );
}

function emitState(state: UpdateState): void {
  log.info('Update state changed:', state);
  currentState = state;
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(AllowedFrontendChannels.UpdateStateChanged, state);
  });
}

export function getUpdateState(): UpdateState {
  return currentState;
}

export function checkForUpdates(): Promise<UpdateState> {
  if (inFlightRequest) {
    return inFlightRequest;
  }
  clearScheduledCheck();
  emitState({ status: 'checking' });
  const request = performCheck()
    .then((result) => {
      scheduleNextCheck(result);
      const state = toPublicUpdateState(result);
      emitState(state);
      return state;
    })
    .finally(() => {
      inFlightRequest = undefined;
    });
  inFlightRequest = request;
  return request;
}

function clearScheduledCheck(): void {
  if (checkTimeout) {
    clearTimeout(checkTimeout);
    checkTimeout = undefined;
  }
}

function scheduleNextCheck(result: InternalUpdateResult): void {
  if (!automaticChecksEnabled) {
    return;
  }
  clearScheduledCheck();
  const delay =
    result.status === 'preparing' ? PREPARING_RETRY_MS : CHECK_INTERVAL_MS;
  log.info('Scheduling next update check:', { status: result.status, delay });
  checkTimeout = setTimeout(() => {
    checkTimeout = undefined;
    void runAutomaticCheck();
  }, delay);
}

async function runAutomaticCheck(): Promise<void> {
  if (!automaticChecksEnabled) {
    return;
  }
  await checkForUpdates();
}

async function performCheck(): Promise<InternalUpdateResult> {
  try {
    if (!installedRelease) {
      throw new Error('The installed release version cannot be determined.');
    }
    const response = await net.fetch(API_ENDPOINT, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) {
      throw new Error(`GitHub returned HTTP ${response.status}.`);
    }
    const payload: unknown = await response.json();
    if (!isGithubRelease(payload)) {
      throw new Error('GitHub returned invalid release information.');
    }
    const assetName = getRequiredAsset();
    return evaluateRelease(installedRelease, payload, assetName);
  } catch (error) {
    log.warn('Update check failed:', error);
    return { status: 'error' };
  }
}

export function evaluateRelease(
  installed: InstalledRelease,
  release: GithubRelease,
  requiredAsset: string | undefined,
): InternalUpdateResult {
  const releaseTag = parseReleaseTag(release.tag_name);
  if (!releaseTag || release.draft || release.prerelease) {
    throw new Error('GitHub returned an unsupported release.');
  }
  if (compareReleaseTags(releaseTag, installed.version) <= 0) {
    return { status: 'up-to-date', installedTag: installed.tag };
  }
  if (!requiredAsset) {
    throw new Error('This installation has no supported update download.');
  }
  const asset = release.assets.find(({ name }) => name === requiredAsset);
  if (asset?.state !== 'uploaded' || asset.size <= 0) {
    return {
      status: 'preparing',
      installedTag: installed.tag,
    };
  }
  if (
    !isValidAssetDownloadUrl(
      asset.browser_download_url,
      release.tag_name,
      asset.name,
    )
  ) {
    throw new Error('GitHub returned an invalid release asset download URL.');
  }
  return {
    status: 'available',
    tag: release.tag_name,
    url: asset.browser_download_url,
  };
}

function toPublicUpdateState(result: InternalUpdateResult): UpdateState {
  return result.status === 'preparing'
    ? { status: 'up-to-date', installedTag: result.installedTag }
    : result;
}

function isGithubRelease(value: unknown): value is GithubRelease {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const release = value as Record<string, unknown>;
  return (
    typeof release.tag_name === 'string' &&
    typeof release.draft === 'boolean' &&
    typeof release.prerelease === 'boolean' &&
    Array.isArray(release.assets) &&
    release.assets.every(
      (asset: unknown) =>
        !!asset &&
        typeof asset === 'object' &&
        typeof (asset as Record<string, unknown>).name === 'string' &&
        typeof (asset as Record<string, unknown>).browser_download_url ===
          'string' &&
        typeof (asset as Record<string, unknown>).state === 'string' &&
        typeof (asset as Record<string, unknown>).size === 'number',
    )
  );
}

function isValidAssetDownloadUrl(
  url: string,
  tag: string,
  assetName: string,
): boolean {
  try {
    const parsedUrl = new URL(url);
    const repositoryUrl = new URL(OPOSSUM_UI_GITHUB_URL);
    return (
      parsedUrl.protocol === 'https:' &&
      parsedUrl.origin === repositoryUrl.origin &&
      parsedUrl.username === '' &&
      parsedUrl.password === '' &&
      parsedUrl.search === '' &&
      parsedUrl.hash === '' &&
      parsedUrl.pathname ===
        new URL(getReleaseAssetDownloadUrl(tag, assetName)).pathname
    );
  } catch {
    return false;
  }
}

export function startAutomaticUpdateChecks(): void {
  if (
    !app.isPackaged ||
    process.env.RESET ||
    !installedRelease ||
    !getRequiredAsset()
  ) {
    return;
  }
  automaticChecksEnabled = true;
  void runAutomaticCheck();
}

export function stopAutomaticUpdateChecks(): void {
  automaticChecksEnabled = false;
  clearScheduledCheck();
}
