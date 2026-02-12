// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  Attributions,
  ClassificationsConfig,
  Resources,
} from '../../shared/shared-types';
import { SortOption } from '../Components/SortButton/useSortingOptions';
import { Filter, ROOT_PATH } from '../shared-constants';
import { ProgressBarData } from '../types/types';
import { getFilteredAttributions } from './scripts/get-filtered-attributions';
import { getProgressData } from './scripts/get-progress-data';

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
type Unionize<T extends object> = NonNullable<
  {
    [k in keyof T]: { name: k; data: T[k] };
  }[keyof T]
>;

export type SignalsWorkerOutput =
  | {
      name: 'progressData';
      data: ProgressBarData;
    }
  | {
      name: 'filteredAttributions';
      data: Attributions;
    }
  | {
      name: 'filteredAttributionsInReportView';
      data: Attributions;
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
    }
  | {
      name: 'filteredAttributionsInReportViewLoading';
      data: boolean;
    };

interface State {
  areHiddenSignalsVisible?: boolean;
  attributionBreakpoints?: Set<string>;
  attributionFilters?: Array<Filter>;
  attributionSearch?: string;
  attributionSelectedLicense?: string;
  attributionSorting?: SortOption;
  externalData?: AttributionData;
  filesWithChildren?: Set<string>;
  manualData?: AttributionData;
  reportViewAttributionFilters?: Array<Filter>;
  reportViewAttributionSelectedLicense?: string;
  resolvedExternalAttributions?: Set<string>;
  resourceId?: string;
  resources?: Resources;
  signalFilters?: Array<Filter>;
  signalSearch?: string;
  signalSelectedLicense?: string;
  signalSorting?: SortOption;
  classifications?: ClassificationsConfig;
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
    filteredAttributionsInReportView: {
      dependencies: [
        'reportViewAttributionFilters',
        'reportViewAttributionSelectedLicense',
        'manualData',
      ],
      loading: 'filteredAttributionsInReportViewLoading',
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
    progressData: {
      dependencies: [
        'attributionBreakpoints',
        'externalData',
        'filesWithChildren',
        'manualData',
        'resolvedExternalAttributions',
        'resources',
        'classifications',
      ],
      loading: undefined,
    },
    filteredAttributionsLoading: { dependencies: [], loading: undefined },
    filteredAttributionsInReportViewLoading: {
      dependencies: [],
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
    this.dispatchFilteredAttributionsInReportView(input);
    this.dispatchFilteredSignals(input);
    this.dispatchProgressData(input);
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
          resources: this.state.resources,
          classifications: this.state.classifications,
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

  private dispatchFilteredAttributionsInReportView(input: SignalsWorkerInput) {
    if (
      this.isHydrated(
        this.state,
        input,
        this.config.filteredAttributionsInReportView.dependencies,
      )
    ) {
      this.dispatch({
        name: 'filteredAttributionsInReportView',
        data: getFilteredAttributions({
          data: this.state.manualData,
          filters: this.state.reportViewAttributionFilters,
          resourceId: ROOT_PATH,
          search: '',
          selectedLicense: this.state.reportViewAttributionSelectedLicense,
          sorting: 'alphabetically',
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
