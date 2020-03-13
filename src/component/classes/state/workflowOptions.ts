import { WorkflowOptions as IWorkflowOptions } from '../../interfaces/index';

export class WorkflowOptions implements IWorkflowOptions {
    empty: boolean;
    scroll: boolean;
    keepScroll: boolean;
    byTimer: boolean;
    noFetch: boolean;

    constructor() {
      this.reset();
    }

    reset() {
      this.empty = false;
      this.scroll = false;
      this.keepScroll = false;
      this.byTimer = false;
      this.noFetch = false;
    }
  }
