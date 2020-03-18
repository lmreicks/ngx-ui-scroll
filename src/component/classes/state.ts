import { BehaviorSubject, Subject } from 'rxjs';

import {
  ItemAdapter,
  State as IState,
  ScrollState as IScrollState,
  SyntheticScroll as ISyntheticScroll,
  WorkflowOptions as IWorkflowOptions,
  IDatasource
} from '../interfaces/index';

import { Settings } from './settings';
import { FetchModel } from './state/fetch';
import { ClipModel } from './state/clip';
import { WorkflowOptions } from './state/workflowOptions';
import { ScrollState, SyntheticScroll } from './state/scroll';
import { itemAdapterEmpty } from '../utils/adapter';
import { LoggerService } from '../../logger.service';

export class State implements IState {

  readonly settings: Settings;

  initTime: number;
  innerLoopCount: number;
  isInitialLoop: boolean;
  workflowCycleCount: number;
  isInitialWorkflowCycle: boolean;
  countDone: number;
  workflowOptions: IWorkflowOptions;

  fetch: FetchModel;
  clip: ClipModel;
  startIndex: number;
  lastPosition: number;
  preFetchPosition: number;
  preAdjustPosition: number;
  sizeBeforeRender: number;
  sizeAfterRender: number;
  fwdPaddingBeforeRender: number;
  bwdPaddingAverageSizeItemsCount: number;

  scrollState: IScrollState;
  syntheticScroll: ISyntheticScroll;

  isLoadingSource: Subject<boolean>;
  loopPendingSource: Subject<boolean>;
  workflowPendingSource: Subject<boolean>;
  firstVisibleSource: BehaviorSubject<ItemAdapter>;
  lastVisibleSource: BehaviorSubject<ItemAdapter>;
  firstVisibleWanted: boolean;
  lastVisibleWanted: boolean;

  private _isLoading: boolean;
  private _loopPending: boolean;
  private _workflowPending: boolean;

  get isLoading(): boolean {
    return this._isLoading;
  }

  set isLoading(value: boolean) {
    if (this._isLoading !== value) {
      this._isLoading = value;
      this.isLoadingSource.next(value);
    }
  }

  get loopPending(): boolean {
    return this._loopPending;
  }

  set loopPending(value: boolean) {
    if (this._loopPending !== value) {
      this._loopPending = value;
      this.loopPendingSource.next(value);
    }
  }

  get workflowPending(): boolean {
    return this._workflowPending;
  }

  set workflowPending(value: boolean) {
    if (this._workflowPending !== value) {
      this._workflowPending = value;
      this.workflowPendingSource.next(value);
    }
  }

  get firstVisibleItem(): ItemAdapter {
    return this.firstVisibleSource.getValue();
  }

  set firstVisibleItem(item: ItemAdapter) {
    if (this.firstVisibleItem.$index !== item.$index) {
      this.firstVisibleSource.next(item);
    }
  }

  get lastVisibleItem(): ItemAdapter {
    return this.lastVisibleSource.getValue();
  }

  set lastVisibleItem(item: ItemAdapter) {
    if (this.lastVisibleItem.$index !== item.$index) {
      this.lastVisibleSource.next(item);
    }
  }

  get time(): number {
    return Number(new Date()) - this.initTime;
  }

  get loop(): string {
    return `${this.settings.instanceIndex}-${this.workflowCycleCount}-${this.innerLoopCount}`;
  }

  get loopNext(): string {
    return `${this.settings.instanceIndex}-${this.workflowCycleCount}-${this.innerLoopCount + 1}`;
  }

  constructor(datasource: IDatasource) {
    this.settings = new Settings(datasource.settings, datasource.devSettings);
    this.initTime = Number(new Date());
    this.innerLoopCount = 0;
    this.isInitialLoop = false;
    this.workflowCycleCount = 1;
    this.isInitialWorkflowCycle = false;
    this.countDone = 0;
    this.workflowOptions = new WorkflowOptions();

    this.fetch = new FetchModel();
    this.clip = new ClipModel();
    this.sizeBeforeRender = 0;
    this.sizeAfterRender = 0;
    this.fwdPaddingBeforeRender = 0;
    this.bwdPaddingAverageSizeItemsCount = 0;

    // TODO: scroll state doesn't seem to be used
    this.scrollState = new ScrollState();
    this.syntheticScroll = new SyntheticScroll();

    this._isLoading = false;
    this._loopPending = false;
    this._workflowPending = false;
    this.isLoadingSource = new Subject<boolean>();
    this.loopPendingSource = new Subject<boolean>();
    this.workflowPendingSource = new Subject<boolean>();
    this.firstVisibleSource = new BehaviorSubject<ItemAdapter>(itemAdapterEmpty);
    this.lastVisibleSource = new BehaviorSubject<ItemAdapter>(itemAdapterEmpty);
    this.firstVisibleWanted = false;
    this.lastVisibleWanted = false;
  }

  setCurrentStartIndex(newStartIndex: any, logger: LoggerService) {
    const { startIndex, minIndex, maxIndex } = this.settings;
    let index = Number(newStartIndex);
    if (isNaN(index)) {
      logger.log(() =>
        `fallback startIndex to settings.startIndex (${startIndex}) because ${newStartIndex} is not a number`);
      index = startIndex;
    }
    if (index < minIndex) {
      logger.log(() => `setting startIndex to settings.minIndex (${minIndex}) because ${index} < ${minIndex}`);
      index = minIndex;
    }
    if (index > maxIndex) {
      logger.log(() => `setting startIndex to settings.maxIndex (${maxIndex}) because ${index} > ${maxIndex}`);
      index = maxIndex;
    }
    this.startIndex = index;
  }

}
