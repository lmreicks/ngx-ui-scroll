import { Scroller } from '../scroller';
import { Process, ProcessStatus } from '../interfaces/index';

export default class Init {

  static run(scroller: Scroller, process?: Process) {
    const { state, workflow } = scroller;

    // TODO: find instance that init is not used as init, that is bad architecture
    const isInitial = !process || process === Process.reload;
    scroller.logger.logCycle(true, state);
    state.isInitialWorkflowCycle = isInitial;
    state.isInitialLoop = isInitial;
    state.workflowPending = true;
    state.isLoading = true;

    // start the cycle stuff,
    // TODO: write more comments when we figure out what Start does
    workflow.call({
      process: Process.init,
      status: ProcessStatus.next,
      payload: { process: process || Process.init }
    });
  }

}
