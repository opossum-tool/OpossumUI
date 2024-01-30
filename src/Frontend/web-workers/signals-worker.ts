// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  Attributions,
  ExternalAttributionSources,
  PackageInfo,
  Resources,
} from '../../shared/shared-types';
import { Filter, FilterCounts, Sorting } from '../shared-constants';
import { PanelData, ProgressBarData } from '../types/types';
import { shouldNotBeCalled } from '../util/should-not-be-called';
import { getAttributionsInFolderContent } from './scripts/get-attributions-in-folder-content';
import { getAutocompleteSignals } from './scripts/get-autocomplete-signals';
import {
  getFilteredAttributionCounts,
  getFilteredAttributions,
} from './scripts/get-filtered-attributions';
import { getProgressData } from './scripts/get-progress-data';
import { getSignalsInFolderContent } from './scripts/get-signals-in-folder-content';

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type SignalsWorkerInput =
  | { name: 'attributionBreakpoints'; data: Set<string> }
  | { name: 'attributionSorting'; data: Sorting }
  | { name: 'attributionSearch'; data: string }
  | { name: 'externalData'; data: AttributionData }
  | { name: 'filesWithChildren'; data: Set<string> }
  | { name: 'manualData'; data: AttributionData }
  | { name: 'resolvedExternalAttributions'; data: Set<string> }
  | { name: 'resourceId'; data: string }
  | { name: 'resources'; data: Resources }
  | { name: 'selectedFilters'; data: Array<Filter> }
  | { name: 'signalSorting'; data: Sorting }
  | { name: 'sources'; data: ExternalAttributionSources };

export type SignalsWorkerOutput =
  | {
      name: 'autocompleteSignals';
      data: Array<PackageInfo>;
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
    }
  | {
      name: 'filteredAttributionCounts';
      data: FilterCounts;
    }
  | {
      name: 'filteredAttributions';
      data: Attributions;
    };

interface State {
  attributionBreakpoints?: Set<string>;
  attributionSearch?: string;
  attributionSorting?: Sorting;
  externalData?: AttributionData;
  filesWithChildren?: Set<string>;
  manualData?: AttributionData;
  resolvedExternalAttributions?: Set<string>;
  resourceId?: string;
  resources?: Resources;
  selectedFilters?: Array<Filter>;
  signalSorting?: Sorting;
  sources?: ExternalAttributionSources;
}

export class SignalsWorker {
  constructor(
    private readonly dispatch: (output: SignalsWorkerOutput) => void,
    private readonly state: State = {},
  ) {}

  public processInput(input: SignalsWorkerInput) {
    this.setData(input);
    this.dispatchSignalsInFolderContent(input);
    this.dispatchAttributionsInFolderContent(input);
    this.dispatchFolderProgressData(input);
    this.dispatchOverallProgressData(input);
    this.dispatchAutocompleteSignals(input);
    this.dispatchFilteredAttributions(input);
    this.dispatchFilteredAttributionCounts(input);
  }

  private setData(input: SignalsWorkerInput) {
    switch (input.name) {
      case 'selectedFilters':
        this.state.selectedFilters = input.data;
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
      case 'signalSorting':
        this.state.signalSorting = input.data;
        break;
      case 'attributionSorting':
        this.state.attributionSorting = input.data;
        break;
      case 'attributionSearch':
        this.state.attributionSearch = input.data;
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
    if (
      this.isHydrated(this.state, input, [
        'resourceId',
        'manualData',
        'signalSorting',
      ])
    ) {
      this.dispatch({
        name: 'attributionsInFolderContent',
        data: getAttributionsInFolderContent({
          resourceId: this.state.resourceId,
          manualData: this.state.manualData,
          sorting: this.state.signalSorting,
        }),
      });
    }
  }

  private dispatchSignalsInFolderContent(input: SignalsWorkerInput) {
    if (
      this.isHydrated(this.state, input, [
        'resourceId',
        'externalData',
        'resolvedExternalAttributions',
        'signalSorting',
      ])
    ) {
      this.dispatch({
        name: 'signalsInFolderContent',
        data: getSignalsInFolderContent({
          resourceId: this.state.resourceId,
          externalData: this.state.externalData,
          resolvedExternalAttributions: this.state.resolvedExternalAttributions,
          sorting: this.state.signalSorting,
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

  private dispatchFilteredAttributionCounts(input: SignalsWorkerInput) {
    if (this.isHydrated(this.state, input, ['manualData'])) {
      this.dispatch({
        name: 'filteredAttributionCounts',
        data: getFilteredAttributionCounts({
          manualData: this.state.manualData,
        }),
      });
    }
  }

  private dispatchFilteredAttributions(input: SignalsWorkerInput) {
    if (
      this.isHydrated(this.state, input, [
        'selectedFilters',
        'manualData',
        'attributionSorting',
        'attributionSearch',
      ])
    ) {
      this.dispatch({
        name: 'filteredAttributions',
        data: getFilteredAttributions({
          selectedFilters: this.state.selectedFilters,
          manualData: this.state.manualData,
          sorting: this.state.attributionSorting,
          search: this.state.attributionSearch,
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
      dependencies.every((dependency) => state[dependency] !== undefined)
    );
  }
}

const worker = new SignalsWorker(self.postMessage.bind(self));

self.onmessage = (event: MessageEvent<SignalsWorkerInput>) => {
  worker.processInput(event.data);
};
