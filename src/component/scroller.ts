import { Observable, Subscription, BehaviorSubject, timer, fromEvent } from 'rxjs';

import { checkDatasource } from './utils/index';
import { Datasource } from './classes/datasource';
import { Settings } from './classes/settings';
import { DomHelper } from './classes/domRoutines';
import { Viewport } from './classes/viewport';
import { Buffer } from './classes/buffer';
import { State } from './classes/state';
import { ScrollerWorkflow, IDatasource } from './interfaces/index';
import { switchMapTo } from 'rxjs/operators';
import { takeUntilDestroy } from './utils/takeUntilDestroy';
import { LoggerService } from '../logger.service';
import { Item } from './classes/item';
import { Adapter } from './classes/adapter';

export class Scroller {
  public workflow: ScrollerWorkflow;

  public datasource: Datasource;
  public settings: Settings;
  public logger: LoggerService;
  public routines: DomHelper;
  public viewport: Viewport;
  public buffer: Buffer;
  public state: State;
  public adapter?: Adapter;

  public innerLoopSubscriptions: Array<Subscription>;

  constructor(
    element: HTMLElement,
    datasource: Datasource | IDatasource,
    version: string, callWorkflow: Function,
    logger: LoggerService,
    $items?: BehaviorSubject<Item[]> // to keep the reference during re-initialization
  ) {
    checkDatasource(datasource);

    this.workflow = <ScrollerWorkflow>{ call: callWorkflow };
    this.innerLoopSubscriptions = [];

    this.settings = new Settings(datasource.settings, datasource.devSettings);
    this.logger = logger;
    this.routines = new DomHelper(this.settings);
    this.state = new State(this.settings);

    this.buffer = new Buffer(this.settings, this.state.startIndex, $items);
    this.viewport = new Viewport(element, this.settings, this.routines, this.state, this.logger);

    this.logger.object('uiScroll settings object', this.settings, true);

    // datasource & adapter initialization
    this.datasourceInit(datasource);

    if ($items) {
      this.init();
    }
  }

  init() {
    this.viewport.reset(0);
    this.state.setCurrentStartIndex(this.settings.startIndex, this.logger);

    const { scrollEventElement } = this.viewport;
    let passiveSupported = false;
    try {
      // check if passive events are sorted
      window.addEventListener(
        'test', <EventListenerOrEventListenerObject>{}, Object.defineProperty({}, 'passive', {
          get: () => passiveSupported = true
        })
      );
    } catch (err) {
    }
    const scrollEventOptions = { passive: passiveSupported };

    timer(this.settings.initializeDelay).pipe(
      switchMapTo(fromEvent(scrollEventElement, 'scroll', scrollEventOptions).pipe(
        takeUntilDestroy(this, 'dispose')
      ))
    );
    this.logger.stat(this, 'initialization');
  }

  datasourceInit(datasource: IDatasource | Datasource) {
    const constructed = datasource instanceof Datasource;
    this.datasource = !constructed
      ? new Datasource(datasource, !this.settings.adapter)
      : <Datasource>datasource;
    if (constructed || this.settings.adapter) {
      this.adapter = new Adapter(this.datasource.adapter, this.state, this.buffer, this.logger, () => this.workflow);
    }
  }

  bindData(): Observable<any> {
    return timer();
  }

  purgeInnerLoopSubscriptions() {
    this.innerLoopSubscriptions.forEach((item: Subscription) => item.unsubscribe());
    this.innerLoopSubscriptions = [];
  }

  purgeScrollTimers(localOnly?: boolean) {
    const { state: { scrollState } } = this;
    if (scrollState.scrollTimer) {
      clearTimeout(scrollState.scrollTimer);
      scrollState.scrollTimer = null;
    }
    if (!localOnly && scrollState.workflowTimer) {
      clearTimeout(scrollState.workflowTimer);
      scrollState.workflowTimer = null;
    }
  }

  dispose() {
    if (this.adapter) {
      this.adapter.dispose();
    }
    this.purgeInnerLoopSubscriptions();
    this.purgeScrollTimers();
  }

  finalize() {
  }
}
