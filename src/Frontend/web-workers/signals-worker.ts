// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionsToHashes,
  AutocompleteSignal,
  ExternalAttributionSources,
  Resources,
} from '../../shared/shared-types';
import { PanelData, ProgressBarData } from '../types/types';
import { PanelAttributionData } from '../util/get-contained-packages';
import { shouldNotBeCalled } from '../util/should-not-be-called';
import { getAttributionsInFolderContent } from './scripts/get-attributions-in-folder-content';
import { getAutocompleteSignals } from './scripts/get-autocomplete-signals';
import { getProgressData } from './scripts/get-progress-data';
import { getSignalsInFolderContent } from './scripts/get-signals-in-folder-content';

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type SignalsWorkerInput =
  | { name: 'attributionBreakpoints'; data: Set<string> }
  | { name: 'attributionsToHashes'; data: AttributionsToHashes }
  | { name: 'externalData'; data: PanelAttributionData }
  | { name: 'filesWithChildren'; data: Set<string> }
  | { name: 'manualData'; data: PanelAttributionData }
  | { name: 'resolvedExternalAttributions'; data: Set<string> }
  | { name: 'resourceId'; data: string }
  | { name: 'resources'; data: Resources }
  | { name: 'sources'; data: ExternalAttributionSources };

export type SignalsWorkerOutput =
  | {
      name: 'autocompleteSignals';
      data: Array<AutocompleteSignal>;
    }
  | {
      name: 'attributionsInFolderContent';
      data: PanelData;
    }
  | {
      name: 'signalsInFolderContent';
      data: PanelData;
    }
  | {
      name: 'overallProgressData';
      data: ProgressBarData;
    }
  | {
      name: 'folderProgressData';
      data: ProgressBarData;
    };

interface State {
  attributionBreakpoints?: Set<string>;
  attributionsToHashes?: AttributionsToHashes;
  externalData?: PanelAttributionData;
  filesWithChildren?: Set<string>;
  manualData?: PanelAttributionData;
  resolvedExternalAttributions?: Set<string>;
  resourceId?: string;
  resources?: Resources;
  sources?: ExternalAttributionSources;
}

export class SignalsWorker {
  constructor(
    private readonly dispatch: (output: SignalsWorkerOutput) => void,
    private readonly state: State = {
      externalData: undefined,
      manualData: undefined,
      resolvedExternalAttributions: undefined,
      sources: undefined,
      resourceId: undefined,
    },
  ) {}

  public processInput(input: SignalsWorkerInput) {
    this.setData(input);
    this.dispatchSignalsInFolderContent(input);
    this.dispatchAttributionsInFolderContent(input);
    this.dispatchFolderProgressData(input);
    this.dispatchOverallProgressData(input);
    this.dispatchAutocompleteSignals(input);
  }

  private setData(input: SignalsWorkerInput) {
    switch (input.name) {
      case 'attributionsToHashes':
        this.state.attributionsToHashes = input.data;
        break;
      case 'externalData':
        this.state.externalData = input.data;
        break;
      case 'manualData':
        this.state.manualData = input.data;
        break;
      case 'resolvedExternalAttributions':
        this.state.resolvedExternalAttributions = input.data;
        break;
      case 'sources':
        this.state.sources = input.data;
        break;
      case 'resourceId':
        this.state.resourceId = input.data;
        break;
      case 'resources':
        this.state.resources = input.data;
        break;
      case 'attributionBreakpoints':
        this.state.attributionBreakpoints = input.data;
        break;
      case 'filesWithChildren':
        this.state.filesWithChildren = input.data;
        break;
      default:
        shouldNotBeCalled(input);
    }
  }

  private dispatchAutocompleteSignals(input: SignalsWorkerInput) {
    if (
      this.isHydrated(this.state, input, [
        'resourceId',
        'externalData',
        'manualData',
        'resolvedExternalAttributions',
        'sources',
      ])
    ) {
      this.dispatch({
        name: 'autocompleteSignals',
        data: getAutocompleteSignals({
          resourceId: this.state.resourceId,
          externalData: this.state.externalData,
          manualData: this.state.manualData,
          resolvedExternalAttributions: this.state.resolvedExternalAttributions,
          sources: this.state.sources,
        }),
      });
    }
  }

  private dispatchAttributionsInFolderContent(input: SignalsWorkerInput) {
    if (this.isHydrated(this.state, input, ['resourceId', 'manualData'])) {
      this.dispatch({
        name: 'attributionsInFolderContent',
        data: getAttributionsInFolderContent({
          resourceId: this.state.resourceId,
          manualData: this.state.manualData,
        }),
      });
    }
  }

  private dispatchSignalsInFolderContent(input: SignalsWorkerInput) {
    if (
      this.isHydrated(this.state, input, [
        'resourceId',
        'attributionsToHashes',
        'externalData',
        'resolvedExternalAttributions',
      ])
    ) {
      this.dispatch({
        name: 'signalsInFolderContent',
        data: getSignalsInFolderContent({
          resourceId: this.state.resourceId,
          attributionsToHashes: this.state.attributionsToHashes,
          externalData: this.state.externalData,
          resolvedExternalAttributions: this.state.resolvedExternalAttributions,
        }),
      });
    }
  }

  private dispatchOverallProgressData(input: SignalsWorkerInput) {
    if (
      this.isHydrated(this.state, input, [
        'attributionBreakpoints',
        'externalData',
        'filesWithChildren',
        'manualData',
        'resolvedExternalAttributions',
        'resources',
      ])
    ) {
      this.dispatch({
        name: 'overallProgressData',
        data: getProgressData({
          attributionBreakpoints: this.state.attributionBreakpoints,
          externalData: this.state.externalData,
          filesWithChildren: this.state.filesWithChildren,
          manualData: this.state.manualData,
          resolvedExternalAttributions: this.state.resolvedExternalAttributions,
          resourceId: '/',
          resources: this.state.resources,
        }),
      });
    }
  }

  private dispatchFolderProgressData(input: SignalsWorkerInput) {
    if (
      this.isHydrated(this.state, input, [
        'attributionBreakpoints',
        'externalData',
        'filesWithChildren',
        'manualData',
        'resolvedExternalAttributions',
        'resourceId',
        'resources',
      ])
    ) {
      this.dispatch({
        name: 'folderProgressData',
        data: getProgressData({
          attributionBreakpoints: this.state.attributionBreakpoints,
          externalData: this.state.externalData,
          filesWithChildren: this.state.filesWithChildren,
          manualData: this.state.manualData,
          resolvedExternalAttributions: this.state.resolvedExternalAttributions,
          resourceId: this.state.resourceId,
          resources: this.state.resources,
        }),
      });
    }
  }

  private isHydrated<T extends Array<keyof State>>(
    state: State,
    input: SignalsWorkerInput,
    dependencies: T,
  ): state is WithRequired<State, (typeof dependencies)[number]> {
    return (
      dependencies.includes(input.name) &&
      dependencies.every((dependency) => !!state[dependency])
    );
  }
}

const worker = new SignalsWorker(self.postMessage.bind(self));

self.onmessage = (event: MessageEvent<SignalsWorkerInput>) => {
  worker.processInput(event.data);
};
