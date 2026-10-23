// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app, net } from 'electron';
import type { AppUpdater, UpdateInfo } from 'electron-updater';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import {
  getReleaseAssetDownloadUrl,
  UPDATE_ASSET_NAMES,
} from '../../shared/release-assets';
import { OPOSSUM_UI_GITHUB_URL } from '../../shared/shared-constants';
import type { UpdateState } from '../../shared/shared-types';
import {
  compareReleaseTags,
  numericReleaseVersion,
  parseInstalledVersion,
  parseReleaseTag,
} from '../../shared/update-version';
import {
  createInstallerUpdater,
  supportsInstallation,
} from './installer-updater';
import logger from './logger';
import { sendToRenderers } from './send-to-renderers';

export {
  compareReleaseTags,
  parseReleaseTag,
} from '../../shared/update-version';

const PREPARING_RETRY_MS = 600_000;
const CHECK_INTERVAL_MS = 3_600_000;
const REQUEST_TIMEOUT_MS = 30_000;
const API_ENDPOINT =
  'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest';
type InternalUpdateResult =
  | Exclude<UpdateState, { status: 'checking' }>
  | {
      status: 'preparing';
      installedTag: string;
    };

interface InstalledRelease {
  tag: string;
  version: NonNullable<ReturnType<typeof parseReleaseTag>>;
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

let updater: AppUpdater | undefined;
let selectedRelease: GithubRelease | undefined;
let transfer: Promise<void> | undefined;
let transferActive = false;
let transferError: Error | undefined;

let installedRelease: InstalledRelease | undefined;

let currentState: UpdateState = { status: 'checking' };
let inFlightRequest: Promise<UpdateState> | undefined;
let checkTimeout: ReturnType<typeof setTimeout> | undefined;
let automaticChecksEnabled = false;

export function initializeUpdateService(installedVersion: string): void {
  if (inFlightRequest || transfer) {
    throw new Error(
      'Cannot initialize the update service during an active request.',
    );
  }
  stopAutomaticUpdateChecks();
  const version = parseInstalledVersion(installedVersion);
  installedRelease = version
    ? { tag: numericReleaseVersion(version), version }
    : undefined;
  selectedRelease = undefined;
  currentState = { status: 'checking' };
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
  logger.info(`Update state changed: ${JSON.stringify(state)}`);
  currentState = state;
  sendToRenderers(AllowedFrontendChannels.UpdateStateChanged, state);
}

export function getUpdateState(): UpdateState {
  return currentState;
}

export function checkForUpdates(): Promise<UpdateState> {
  if (
    transfer ||
    currentState.status === 'downloading' ||
    currentState.status === 'downloaded' ||
    currentState.status === 'restarting'
  ) {
    return Promise.resolve(currentState);
  }
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
      return currentState;
    })
    .finally(() => {
      inFlightRequest = undefined;
    });
  inFlightRequest = request;
  return request;
}

export function downloadUpdate(tag: string): Promise<UpdateState> {
  if (!supportsInstallation() || selectedRelease?.tag_name !== tag) {
    return Promise.reject(
      new Error('This update is no longer available. Check for updates again.'),
    );
  }
  if (
    currentState.status === 'downloading' ||
    currentState.status === 'downloaded' ||
    currentState.status === 'restarting'
  ) {
    return Promise.resolve(currentState);
  }
  if (
    currentState.status !== 'available' &&
    !(currentState.status === 'error' && currentState.retry === 'download')
  ) {
    return Promise.reject(new Error('Check for updates before downloading.'));
  }
  clearScheduledCheck();
  startDownload(selectedRelease);
  return Promise.resolve(currentState);
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
  logger.info(
    `Scheduling next update check in ${delay} ms after ${result.status}.`,
  );
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
      logger.warn(
        'Update check failed: The installed release version cannot be determined.',
      );
      return { status: 'error', reason: 'unknown-installed-version' };
    }
    const assetName = getRequiredAsset();
    if (!assetName) {
      logger.warn(
        'Update check failed: This installation has no supported update download.',
      );
      return { status: 'error', reason: 'unsupported-installation' };
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
    const result = evaluateRelease(installedRelease, payload, assetName);
    if (result.status === 'available' && supportsInstallation()) {
      const names = requiredInstallerAssets(assetName);
      if (
        !names.every((name) =>
          payload.assets.some(
            (asset) =>
              asset.name === name &&
              asset.state === 'uploaded' &&
              Number.isFinite(asset.size) &&
              asset.size > 0 &&
              isValidAssetDownloadUrl(
                asset.browser_download_url,
                payload.tag_name,
                name,
              ),
          ),
        )
      ) {
        return { status: 'preparing', installedTag: installedRelease.tag };
      }
      selectedRelease = payload;
      return { ...result, canInstall: true };
    }
    return result;
  } catch (error) {
    logger.warn(
      `Update check failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    );
    return { status: 'error' };
  }
}

export function evaluateRelease(
  installed: InstalledRelease,
  release: GithubRelease,
  requiredAsset: string,
): InternalUpdateResult {
  const releaseTag = parseReleaseTag(release.tag_name);
  if (!releaseTag) {
    throw new Error('GitHub returned an unsupported release.');
  }
  if (compareReleaseTags(releaseTag, installed.version) <= 0) {
    return { status: 'up-to-date', installedTag: installed.tag };
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

function requiredInstallerAssets(asset: string): Array<string> {
  return process.platform === 'win32'
    ? [asset, `${asset}.blockmap`, 'latest.yml']
    : [asset, 'latest-linux.yml'];
}

function getInstaller(): AppUpdater {
  if (!updater) {
    updater = createInstallerUpdater();
    updater.on('download-progress', ({ percent }) => {
      if (
        transferActive &&
        currentState.status === 'downloading' &&
        !transferError &&
        selectedRelease &&
        Number.isFinite(percent)
      ) {
        emitState({
          status: 'downloading',
          tag: selectedRelease.tag_name,
          percent: Math.max(currentState.percent, Math.min(100, percent)),
        });
      }
    });
    // Completion is committed by the download promise after validation, not by
    // uncorrelated update-available/update-downloaded events.
    updater.on('error', (error) => {
      logger.warn(`Installer update failed: ${error.message}`);
      if (transferActive) {
        transferError = error;
      }
      if (currentState.status === 'restarting') {
        restoreDownloadedUpdate(error);
      }
    });
  }
  return updater;
}

export function validateInstallerManifest(
  info: UpdateInfo,
  release: GithubRelease,
  assetName: string,
): void {
  const parsed = parseReleaseTag(release.tag_name);
  if (
    !parsed ||
    info.version !== numericReleaseVersion(parsed) ||
    !Array.isArray(info.files) ||
    info.files.length !== 1 ||
    ('packages' in info && info.packages)
  ) {
    throw new Error('The update manifest does not match the selected release.');
  }
  const asset = release.assets.find(({ name }) => name === assetName);
  const file = info.files[0];
  const base = getReleaseAssetDownloadUrl(release.tag_name, '');
  const expectedUrl = getReleaseAssetDownloadUrl(release.tag_name, assetName);
  // Reject alternate hosts, other releases, extra payloads, and legacy references
  // disagreeing with files. Full downloads avoid unvalidated old blockmaps.
  if (
    !asset ||
    new URL(file.url, base).href !== expectedUrl ||
    (info.path && new URL(info.path, base).href !== expectedUrl) ||
    file.size !== asset.size ||
    !file.sha512
  ) {
    throw new Error(
      'The update manifest references unexpected release assets.',
    );
  }
}

function startDownload(release: GithubRelease): void {
  if (transfer) {
    return;
  }
  emitState({ status: 'downloading', tag: release.tag_name, percent: 0 });
  transferError = undefined;
  transferActive = true;
  // Defer to ensure transfer is assigned before any synchronous adapter errors.
  transfer = Promise.resolve()
    .then(async () => {
      const installer = getInstaller();
      installer.setFeedURL({
        provider: 'generic',
        url: getReleaseAssetDownloadUrl(release.tag_name, ''),
        channel: 'latest',
        useMultipleRangeRequest: false,
      });
      const result = await installer.checkForUpdates();
      if (!result?.isUpdateAvailable) {
        throw new Error(
          'The installer did not find the selected newer release.',
        );
      }
      validateInstallerManifest(
        result.updateInfo,
        release,
        getRequiredAsset()!,
      );
      if (transferError) {
        throw transferError;
      }
      const files = await installer.downloadUpdate();
      if (transferError) {
        throw transferError;
      }
      if (!files.length) {
        throw new Error('No installer was downloaded.');
      }
      emitState({ status: 'downloaded', tag: release.tag_name });
    })
    .catch((error: unknown) => {
      logger.warn(`Update download failed: ${String(error)}`);
      emitState({
        status: 'error',
        retry: 'download',
        message: error instanceof Error ? error.message : String(error),
      });
    })
    .finally(() => {
      transferActive = false;
      transfer = undefined;
      if (currentState.status === 'error') {
        scheduleNextCheck(currentState);
      }
    });
}

/** Installation and application exit are owned by electron-updater. */
export function installDownloadedUpdate(): void {
  if (currentState.status === 'restarting') {
    return;
  }
  if (currentState.status !== 'downloaded' || !updater) {
    throw new Error('No downloaded update is ready.');
  }
  emitState({ status: 'restarting', tag: currentState.tag });
  try {
    updater.quitAndInstall(false, true);
  } catch (error) {
    restoreDownloadedUpdate(error);
    throw error;
  }
}

function restoreDownloadedUpdate(error: unknown): void {
  if (selectedRelease) {
    emitState({
      status: 'downloaded',
      tag: selectedRelease.tag_name,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
