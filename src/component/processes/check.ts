import { Scroller } from '../scroller';
import { Process, ProcessStatus } from '../interfaces/index';

/**
 * Checks if any of current items changed it's size and runs a procedure to provide internal consistency and new items fetching if needed.
 */
export default class Check {

  static run(scroller: Scroller) {
    const { workflow, buffer, state: { fetch } } = scroller;
    let min = Infinity, max = -Infinity;

    buffer.items.forEach(item => {
      const size = item.size;
      item.setSize();
      if (item.size !== size) {
        buffer.cache.add(item);
        min = Math.min(min, item.$index);
        max = Math.max(max, item.$index);
      }
    });

    if (Number.isFinite(min)) {
      scroller.state.clip.noClip = true;
      fetch.firstIndexBuffer = buffer.firstIndex;
      fetch.lastIndexBuffer = buffer.lastIndex;
      fetch.replace(
        buffer.items.filter(item => item.$index >= min && item.$index <= max)
      );
    }

    scroller.logger.stat(scroller, 'check');

    workflow.call({
      process: Process.check,
      status: Number.isFinite(min) ? ProcessStatus.next : ProcessStatus.done
    });
  }

}
