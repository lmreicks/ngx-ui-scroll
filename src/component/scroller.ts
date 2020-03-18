import { Observable, Subscription, BehaviorSubject, timer } from 'rxjs';

import { checkDatasource } from './utils/index';
import { Datasource } from './classes/datasource';
import { Settings } from './classes/settings';
import { DomHelper } from './classes/domRoutines';
import { Buffer } from './classes/buffer';
import { State } from './classes/state';
import { ScrollerWorkflow, IDatasource } from './interfaces/index';
import { LoggerService } from '../logger.service';
import { Item } from './classes/item';
import { Adapter } from './classes/adapter';
import { UiScrollViewportDirective as Viewport } from '../ui-scroll-viewport.directive';
import { Paddings } from './classes/paddings';

export class Scroller {
  public workflow: ScrollerWorkflow;

  public datasource: Datasource;
  public logger: LoggerService;
  public routines: DomHelper;
  public buffer: Buffer;
  public state: State;
  public adapter?: Adapter;
  readonly viewport: Viewport;

  get settings(): Settings {
    return this.state.settings;
  }

  public innerLoopSubscriptions: Array<Subscription>;

  constructor(
    datasource: Datasource | IDatasource,
    viewport: Viewport, state: State, callWorkflow: Function,
    logger: LoggerService,
    $items?: BehaviorSubject<Item[]> // to keep the reference during re-initialization
  ) {
    checkDatasource(datasource);
    this.state = state;

    this.workflow = <ScrollerWorkflow>{ call: callWorkflow };
    this.viewport = viewport;
    this.innerLoopSubscriptions = [];
    this.logger = logger;
    this.routines = new DomHelper(this.settings);

    this.buffer = new Buffer(this.settings, this.state.startIndex, $items);

    this.logger.object('uiScroll settings object', this.settings, true);

    // datasource & adapter initialization
    this.datasourceInit(datasource);

    if ($items) {
      this.init();
    }
  }

  init() {
    this.viewport.init(this);

    // this.viewport.reset(0);
    this.state.setCurrentStartIndex(this.settings.startIndex, this.logger);
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
    return timer(200);
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
