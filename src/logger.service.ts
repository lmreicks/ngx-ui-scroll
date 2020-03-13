import { Injectable, Inject } from '@angular/core';
import { DevSettings, Process, ProcessStatus as Status, ProcessSubject, State } from './component/interfaces';
import { DevConfigToken } from './ui-scroll.module';
import { Scroller } from './component/scroller';
import { defaultDevSettings } from './component/classes/settings';

type LogType = [any?, ...any[]];

@Injectable()
export class LoggerService {
  private debug = false;

  private initTime: number;
  get time(): number {
    return new Date().getTime() - this.initTime;
  }

  readonly immediateLog: boolean;
  readonly logTime: boolean;
  readonly getTime: Function;
  readonly getWorkflowCycleData: Function;
  private logs: Array<any> = [];

  constructor(@Inject(DevConfigToken) private devSettings: DevSettings = defaultDevSettings) {
    this.initTime = new Date().getTime();
    this.debug = devSettings.debug || false;
    this.immediateLog = devSettings.immediateLog || false;
    this.logTime = devSettings.logTime || false;

    this.log(() => `uiScroll Workflow has been started`);
  }

  static getStat(scroller: Scroller): string {
    const { buffer, viewport } = scroller;
    const first = buffer.getFirstVisibleItem();
    const last = buffer.getLastVisibleItem();
    return 'pos: ' + viewport.scrollPosition + ', ' +
      'size: ' + viewport.getScrollableSize() + ', ' +
      'bwd_p: ' + viewport.paddings.backward.size + ', ' +
      'fwd_p: ' + viewport.paddings.forward.size + ', ' +
      'aver: ' + (buffer.hasItemSize ? buffer.averageSize : 'no') + ', ' +
      'items: ' + buffer.getVisibleItemsCount() + ', ' +
      'range: ' + (first && last ? `[${first.$index}..${last.$index}]` : 'no');
  }

  stat(scroller: Scroller, str?: string) {
    if (scroller.settings.debug) {
      const logStyles = ['color: #888; border: dashed #888 0; border-bottom-width: 0px', 'color: #000; border-width: 0'];
      this.log(() => ['%cstat' + (str ? ` ${str}` : '') + ',%c ' + LoggerService.getStat(scroller), ...logStyles]);
    }
  }

  object(str: string, obj: any, stringify?: boolean) {
    this.log(() => [
      str,
      stringify
        ? JSON.stringify(obj)
          .replace(/"/g, '')
          .replace(/(\{|\:|\,)/g, '$1 ')
          .replace(/(\})/g, ' $1')
        : obj
    ]);
  }

  /**
   *
   * @param data
   */
  logProcess(data: ProcessSubject, state: State) {
    // TODO: possibly pass in State here, this will get rid of the need for passing in scroller to logger
    if (!this.devSettings.debug) {
      return;
    }
    const { process, status } = data;
    const options = state.workflowOptions;

    // standard process log
    // const processLog = `process ${process}, %c${status}%c` + (!options.empty ? ',' : '');
    // const styles = [status === Status.error ? 'color: #cc0000;' : '', 'color: #000000;'];
    // this.log(() => [processLog, ...styles, data.payload, ...(!options.empty ? [options] : [])]);

    // inner loop start-end log
    const loopLog: string[] = [];
    if (
      process === Process.init && status === Status.next ||
      process === Process.scroll && status === Status.next && options.keepScroll ||
      process === Process.end && status === Status.next && options.byTimer
    ) {
      loopLog.push(`%c---=== loop ${state.loopNext} start`);
    } else if (
      process === Process.end && !options.byTimer
    ) {
      loopLog.push(`%c---=== loop ${state.loop} done`);
      if (status === Status.next && !(options.keepScroll)) {
        loopLog[0] += `, loop ${state.loopNext} start`;
      }
    }
    if (loopLog.length) {
      this.log(() => [...loopLog, 'color: #006600;']);
    }
  }

  /**
   * Logs cycle information
   * @param start If this is the start of the cycle
   */
  logCycle(start = true) {
    const logData = this.getWorkflowCycleData();
    const border = start ? '1px 0 0 1px' : '0 0 1px 1px';
    const logStyles = `color: #0000aa; border: solid #555 1px; border-width: ${border}; margin-left: -2px`;
    this.log(() => [`%c   ~~~ WF Cycle ${logData} ${start ? 'STARTED' : 'FINALIZED'} ~~~  `, logStyles]);
  }

  logError(str: string, state: State) {
    if (this.debug) {
      const logStyles = ['color: #a00;', 'color: #000'];
      this.log(() => ['error:%c' + (str ? ` ${str}` : '') + `%c (loop ${state.loop})`, ...logStyles]);
    }
  }

  log(...args: any[]) {
    if (this.debug) {
      if (typeof args[0] === 'function') {
        args = args[0]();
        if (!Array.isArray(args)) {
          args = [args];
        }
      }
      if (args.every(item => item === undefined)) {
        return;
      }
      if (this.logTime) {
        args = [...args, this.getTime()];
      }
      if (this.immediateLog) {
        console.log.apply(this, <LogType>args);
      } else {
        this.logs.push(args);
      }
    }
  }

  logForce(...args: any[]) {
    if (this.debug) {
      if (!this.immediateLog && this.logs.length) {
        this.logs.forEach(logArgs => console.log.apply(this, logArgs));
        this.logs = [];
      }
      if (args.length) {
        console.log.apply(this, <LogType>args);
      }
    }
  }
}
