// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  AttributionsToHashes,
  ExternalAttributionSources,
  SignalWithCount,
} from '../../shared/shared-types';
import { PanelData } from '../types/types';
import { shouldNotBeCalled } from '../util/should-not-be-called';
import { getAttributionsInFolderContent } from './scripts/get-attributions-in-folder-content';
import { getAutocompleteSignals } from './scripts/get-autocomplete-signals';
import { getSignalsInFolderContent } from './scripts/get-signals-in-folder-content';

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type SignalsWorkerInput =
  | { name: 'attributionsToHashes'; data: AttributionsToHashes }
  | { name: 'externalData'; data: AttributionData }
  | { name: 'manualData'; data: AttributionData }
  | { name: 'resolvedExternalAttributions'; data: Set<string> }
  | { name: 'sources'; data: ExternalAttributionSources }
  | { name: 'resourceId'; data: string };

export type SignalsWorkerOutput =
  | {
      name: 'autocompleteSignals';
      data: Array<SignalWithCount>;
    }
  | {
      name: 'attributionsInFolderContent';
      data: PanelData;
    }
  | {
      name: 'signalsInFolderContent';
      data: PanelData;
    };

interface State {
  attributionsToHashes?: AttributionsToHashes;
  externalData?: AttributionData;
  manualData?: AttributionData;
  resolvedExternalAttributions?: Set<string>;
  sources?: ExternalAttributionSources;
  resourceId?: string;
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
    this.dispatchAutocompleteSignals(input);
    this.dispatchAttributionsInFolderContent(input);
    this.dispatchSignalsInFolderContent(input);
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
