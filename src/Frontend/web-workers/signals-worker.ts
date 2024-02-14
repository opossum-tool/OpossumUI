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
import { Filter, FilterCounts, ROOT_PATH, Sorting } from '../shared-constants';
import { ProgressBarData } from '../types/types';
import { getAutocompleteSignals } from './scripts/get-autocomplete-signals';
import {
  getFilteredAttributionCounts,
  getFilteredAttributions,
} from './scripts/get-filtered-attributions';
import { getProgressData } from './scripts/get-progress-data';

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
type Unionize<T extends object> = NonNullable<
  {
    [k in keyof T]: { name: k; data: NonNullable<T[k]> };
  }[keyof T]
>;

export type SignalsWorkerOutput =
  | {
      name: 'autocompleteSignals';
      data: Array<PackageInfo>;
    }
  | {
      name: 'progressData';
      data: ProgressBarData;
    }
  | {
      name: 'filteredAttributionCounts';
      data: FilterCounts;
    }
  | {
      name: 'filteredAttributions';
      data: Attributions;
    }
  | {
      name: 'filteredSignalCounts';
      data: FilterCounts;
    }
  | {
      name: 'filteredSignals';
      data: Attributions;
    }
  | {
      name: 'filteredSignalsLoading';
      data: boolean;
    }
  | {
      name: 'filteredAttributionsLoading';
      data: boolean;
    };

interface State {
  areHiddenSignalsVisible?: boolean;
  attributionBreakpoints?: Set<string>;
  attributionFilters?: Array<Filter>;
  attributionSearch?: string;
  attributionSelectedLicense?: string;
  attributionSorting?: Sorting;
  externalData?: AttributionData;
  filesWithChildren?: Set<string>;
  manualData?: AttributionData;
  resolvedExternalAttributions?: Set<string>;
  resourceId?: string;
  resources?: Resources;
  signalFilters?: Array<Filter>;
  signalSearch?: string;
  signalSelectedLicense?: string;
  signalSorting?: Sorting;
  sources?: ExternalAttributionSources;
}

export type SignalsWorkerInput = Unionize<State>;

export class SignalsWorker {
  private readonly config = {
    filteredAttributions: {
      dependencies: [
        'attributionBreakpoints',
        'attributionFilters',
        'attributionSearch',
        'attributionSelectedLicense',
        'attributionSorting',
        'manualData',
        'resourceId',
      ],
      loading: 'filteredAttributionsLoading',
    },
    filteredSignals: {
      dependencies: [
        'areHiddenSignalsVisible',
        'externalData',
        'resolvedExternalAttributions',
        'resourceId',
        'signalFilters',
        'signalSearch',
        'signalSelectedLicense',
        'signalSorting',
      ],
      loading: 'filteredSignalsLoading',
    },
    autocompleteSignals: {
      dependencies: [
        'resourceId',
        'externalData',
        'manualData',
        'resolvedExternalAttributions',
        'sources',
      ],
      loading: undefined,
    },
    progressData: {
      dependencies: [
        'attributionBreakpoints',
        'externalData',
        'filesWithChildren',
        'manualData',
        'resolvedExternalAttributions',
        'resources',
      ],
      loading: undefined,
    },
    filteredAttributionCounts: {
      dependencies: [
        'attributionFilters',
        'attributionSearch',
        'attributionSelectedLicense',
        'manualData',
        'resourceId',
      ],
      loading: undefined,
    },
    filteredAttributionsLoading: { dependencies: [], loading: undefined },
    filteredSignalCounts: {
      dependencies: [
        'areHiddenSignalsVisible',
        'externalData',
        'resolvedExternalAttributions',
        'resourceId',
        'signalFilters',
        'signalSearch',
        'signalSelectedLicense',
      ],
      loading: undefined,
    },
    filteredSignalsLoading: { dependencies: [], loading: undefined },
  } satisfies Record<
    SignalsWorkerOutput['name'],
    {
      dependencies: Array<keyof State>;
      loading: SignalsWorkerOutput['name'] | undefined;
    }
  >;

  constructor(
    private readonly dispatch: (output: SignalsWorkerOutput) => void,
    private readonly state: State = {},
  ) {}

  public processInput(input: SignalsWorkerInput) {
    this.setData(input);
    this.dispatchFilteredAttributions(input);
    this.dispatchFilteredSignals(input);
    this.dispatchAutocompleteSignals(input);
    this.dispatchProgressData(input);
    this.dispatchFilteredAttributionCounts(input);
    this.dispatchFilteredSignalCounts(input);
  }

  private setData(input: SignalsWorkerInput) {
    //@ts-expect-error TypeScript does not support dynamic keys
    this.state[input.name] = input.data;

    Object.values(this.config).forEach(({ loading, dependencies }) => {
      if (
        loading &&
        dependencies.some((dependency) => dependency === input.name)
      ) {
        this.dispatch({ name: loading, data: true });
      }
    });
  }

  private dispatchAutocompleteSignals(input: SignalsWorkerInput) {
    if (
      this.isHydrated(
        this.state,
        input,
        this.config.autocompleteSignals.dependencies,
      )
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

  private dispatchProgressData(input: SignalsWorkerInput) {
    if (
      this.isHydrated(this.state, input, this.config.progressData.dependencies)
    ) {
      this.dispatch({
        name: 'progressData',
        data: getProgressData({
          attributionBreakpoints: this.state.attributionBreakpoints,
          externalData: this.state.externalData,
          filesWithChildren: this.state.filesWithChildren,
          manualData: this.state.manualData,
          resolvedExternalAttributions: this.state.resolvedExternalAttributions,
          resourceId: ROOT_PATH,
          resources: this.state.resources,
        }),
      });
    }
  }

  private dispatchFilteredAttributionCounts(input: SignalsWorkerInput) {
    if (
      this.isHydrated(
        this.state,
        input,
        this.config.filteredAttributionCounts.dependencies,
      )
    ) {
      this.dispatch({
        name: 'filteredAttributionCounts',
        data: getFilteredAttributionCounts({
          data: this.state.manualData,
          filters: this.state.attributionFilters,
          includeGlobal: true,
          resourceId: this.state.resourceId,
          search: this.state.attributionSearch,
          selectedLicense: this.state.attributionSelectedLicense,
        }),
      });
    }
  }

  private dispatchFilteredAttributions(input: SignalsWorkerInput) {
    if (
      this.isHydrated(
        this.state,
        input,
        this.config.filteredAttributions.dependencies,
      )
    ) {
      this.dispatch({
        name: 'filteredAttributions',
        data: getFilteredAttributions({
          attributionBreakpoints: this.state.attributionBreakpoints,
          data: this.state.manualData,
          filters: this.state.attributionFilters,
          includeGlobal: true,
          resourceId: this.state.resourceId,
          search: this.state.attributionSearch,
          selectedLicense: this.state.attributionSelectedLicense,
          sorting: this.state.attributionSorting,
        }),
      });
    }
  }

  private dispatchFilteredSignalCounts(input: SignalsWorkerInput) {
    if (
      this.isHydrated(
        this.state,
        input,
        this.config.filteredSignalCounts.dependencies,
      )
    ) {
      this.dispatch({
        name: 'filteredSignalCounts',
        data: getFilteredAttributionCounts({
          data: this.state.externalData,
          resolvedExternalAttributions: this.state.areHiddenSignalsVisible
            ? undefined
            : this.state.resolvedExternalAttributions,
          resourceId: this.state.resourceId,
          filters: this.state.signalFilters,
          search: this.state.signalSearch,
          selectedLicense: this.state.signalSelectedLicense,
        }),
      });
    }
  }

  private dispatchFilteredSignals(input: SignalsWorkerInput) {
    if (
      this.isHydrated(
        this.state,
        input,
        this.config.filteredSignals.dependencies,
      )
    ) {
      this.dispatch({
        name: 'filteredSignals',
        data: getFilteredAttributions({
          data: this.state.externalData,
          filters: this.state.signalFilters,
          resolvedExternalAttributions: this.state.areHiddenSignalsVisible
            ? undefined
            : this.state.resolvedExternalAttributions,
          resourceId: this.state.resourceId,
          search: this.state.signalSearch,
          selectedLicense: this.state.signalSelectedLicense,
          sorting: this.state.signalSorting,
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
