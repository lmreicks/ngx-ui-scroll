import { Observable, Subscription, Observer, timer, fromEvent } from 'rxjs';

import { UiScrollComponent } from '../ui-scroll.component';
import { checkDatasource } from './utils/index';
import { Datasource } from './classes/datasource';
import { Settings } from './classes/settings';
import { DomHelper } from './classes/domRoutines';
import { Viewport } from './classes/viewport';
import { Buffer } from './classes/buffer';
import { State } from './classes/state';
import { CallWorkflow } from './interfaces/index';
import { switchMapTo } from 'rxjs/operators';
import { takeUntilDestroy } from './utils/takeUntilDestroy';
import { LoggerService } from '../logger.service';

export class Scroller {

  readonly runChangeDetector: Function;
  readonly callWorkflow: CallWorkflow;

  public version: string;
  public datasource: Datasource;
  public settings: Settings;
  public logger: LoggerService;
  public routines: DomHelper;
  public viewport: Viewport;
  public buffer: Buffer;
  public state: State;

  public innerLoopSubscriptions: Array<Subscription>;

  constructor(context: UiScrollComponent, callWorkflow: CallWorkflow, logger: LoggerService) {
    const datasource = <Datasource>checkDatasource(context.datasource);
    this.datasource = datasource;
    this.version = context.version;

    this.runChangeDetector = () => {
      if (!(context.changeDetector as unknown as { destroyed: boolean }).destroyed) {
        context.changeDetector.markForCheck();
      }
    };

    this.callWorkflow = callWorkflow;
    this.innerLoopSubscriptions = [];

    // TODO: Decouple logger from Scroller
    // Currently logger needs scroller.state, which doesn't get initialized until after
    // and then state takes in Logger. (logger should not need anything)
    this.logger = logger;
    this.settings = new Settings(datasource.settings, datasource.devSettings);
    this.routines = new DomHelper(this.settings);
    this.state = new State(this.settings);
    this.state.setCurrentStartIndex(this.settings.startIndex, this.logger);

    this.buffer = new Buffer(this.settings, this.state.startIndex, this.logger);
    this.viewport = new Viewport(context.elementRef, this.settings, this.routines, this.state, this.logger);

    this.logger.object('uiScroll settings object', this.settings, true);

    this.buffer.$items.pipe(
      takeUntilDestroy(context)
    ).subscribe(items => context.items = items);

    this.init(context);

    this.datasourceInit();
  }

  init(context: UiScrollComponent) {
    this.viewport.reset(0);

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
        takeUntilDestroy(context)
      ))
    );
    this.logger.stat(this, 'initialization');
  }

  datasourceInit() {
    const { datasource, settings } = this;
    if (!datasource.constructed) {
      this.datasource = new Datasource(datasource, !settings.adapter);
      if (settings.adapter) {
        this.datasource.adapter.initialize(this);
        datasource.adapter = this.datasource.adapter;
      }
    } else {
      this.datasource.adapter.initialize(this);
    }
  }

  bindData(): Observable<any> {
    this.runChangeDetector();
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
    this.purgeInnerLoopSubscriptions();
    this.purgeScrollTimers();
  }
}
