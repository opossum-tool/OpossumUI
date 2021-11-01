import { getPanelData } from './resource-details-tabs-helpers';
import { expose } from 'comlink';

const worker = { getPanelData };

export type GetPanelDataWorker = typeof worker;

expose(worker);
