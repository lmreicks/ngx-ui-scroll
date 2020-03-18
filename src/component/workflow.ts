import { BehaviorSubject, timer, fromEvent } from 'rxjs';

import { Scroller } from './scroller';
import { runStateMachine } from './workflow-transducer';
import {
  IDatasource,
  Process,
  ProcessStatus as Status,
  ProcessSubject,
  WorkflowError,
  ScrollerWorkflow,
  InterruptParams,
  StateMachineMethods,
  ProcessStatus
} from './interfaces/index';
import { LoggerService } from '../logger.service';
import { takeUntilDestroy } from './utils/takeUntilDestroy';
import { UiScrollViewportDirective } from '../ui-scroll-viewport.directive';
import { Paddings } from './classes/paddings';
import { State } from './classes/state';

export class Workflow {

  isInitialized: boolean;
  scroller: Scroller;
  process$: BehaviorSubject<ProcessSubject>;
  cyclesDone: number;
  interruptionCount: number;
  errors: Array<WorkflowError>;

  readonly propagateChanges: Function;
  private stateMachineMethods: StateMachineMethods;

  constructor(datasource: IDatasource,
    private viewport: UiScrollViewportDirective,
    private state: State,
    private logger: LoggerService, run: Function) {
    this.isInitialized = false;
    this.process$ = new BehaviorSubject(<ProcessSubject>{
      process: Process.init,
      status: Status.start
    });
    this.propagateChanges = run;
    this.callWorkflow = <any>this.callWorkflow.bind(this);
    this.scroller = new Scroller(datasource, this.viewport, this.state, this.callWorkflow, this.logger);
    this.cyclesDone = 0;
    this.interruptionCount = 0;
    this.errors = [];
    this.stateMachineMethods = {
      run: this.runProcess(),
      interrupt: this.interrupt.bind(this),
      done: this.done.bind(this),
      onError: this.onError.bind(this)
    };

    timer(this.scroller.settings.initializeDelay).subscribe(this.init.bind(this));
  }

  init() {
    this.scroller.init();
    this.isInitialized = true;

    // propagate the item list to the view
    this.scroller.buffer.$items.pipe(
      takeUntilDestroy(this, 'dispose')
    ).subscribe(items => this.propagateChanges(items));

    // run the workflow process
    this.process$.pipe(
      takeUntilDestroy(this, 'dispose')
    ).subscribe(this.process.bind(this));

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

    fromEvent(scrollEventElement, 'scroll', scrollEventOptions).pipe(
      takeUntilDestroy(this, 'dispose')
    ).subscribe(event => {
      this.scroller.workflow.call({
        process: Process.scroll,
        status: ProcessStatus.start,
        payload: { event }
      });
    }
    );
  }

  callWorkflow(processSubject: ProcessSubject) {
    if (!this.isInitialized) {
      return;
    }

    this.process$.next(processSubject);
  }

  process(data: ProcessSubject) {
    const { status, process, payload } = data;
    if (this.scroller.settings.logProcessRun) {
      this.scroller.logger.log(() => [
        '%cfire%c', ...['color: #cc7777;', 'color: #000000;'], process, `"${status}"`, ...(payload ? [payload] : [])
      ]);
    }
    this.scroller.logger.logProcess(data, this.scroller.state);
    if (process === Process.end) {
      this.scroller.finalize();
    }
    runStateMachine({
      input: data,
      methods: this.stateMachineMethods
    });
  }

  runProcess() {
    return (process: any) =>
      (...args: any[]) => {
        if (this.scroller.settings.logProcessRun) {
          this.scroller.logger.log(() => ['run', process.name, ...args]);
        }
        process.run(this.scroller, ...args);
      };
  }

  onError(process: Process, payload: any) {
    const message: string = payload && payload.error || '';
    this.errors.push({
      process,
      message,
      time: this.scroller.state.time,
      loop: this.scroller.state.loopNext
    });
    this.scroller.logger.logError(message, this.scroller.state);
  }

  interrupt({ process, finalize, datasource }: InterruptParams) {
    console.log('interupt');
    if (finalize) {
      const { workflow, logger } = this.scroller;
      // we are going to create a new reference for the scroller.workflow object
      // calling the old version of the scroller.workflow by any outstanding async processes will be skipped
      workflow.call = (p?: ProcessSubject) => logger.log('[skip wf call]');
      (<any>workflow.call).interrupted = true;
      this.scroller.workflow = <ScrollerWorkflow>{ call: <Function>this.callWorkflow };
      this.interruptionCount++;
      logger.log(() =>
        `workflow had been interrupted by the ${process} process (${this.interruptionCount})`
      );
    }
    if (datasource) {
      this.scroller.logger.log('new Scroller instantiation');
      const {
        state,
        workflow: { call },
        buffer: { $items }
      } = this.scroller;
      this.scroller = new Scroller(datasource, this.viewport, state, call, this.logger, $items);
    }
  }

  done() {
    const { state } = this.scroller;
    this.cyclesDone++;
    this.scroller.logger.logCycle(false, state);
    state.workflowCycleCount = this.cyclesDone + 1;
    state.isInitialWorkflowCycle = false;
    state.workflowPending = false;
    if (state.scrollState.scrollTimer === null) {
      state.isLoading = false;
    }
    this.finalize();
  }

  dispose() {
    this.scroller.dispose();
    this.isInitialized = false;
  }

  finalize() {
  }

}
