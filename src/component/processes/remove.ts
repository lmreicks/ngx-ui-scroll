import { Scroller } from '../scroller';
import { Direction, ItemsPredicate, Process, ProcessStatus } from '../interfaces/index';
import { isFunction } from '../utils/utils';

/**
 * Removes items from current buffer. Predicate is a function to be applied to every item presently in the buffer.
 * Predicate must return boolean value. If predicate's return value is true, the item will be removed.
 * Note! Current implementation allows to remove only a continuous series of items per call.
 * If you want to remove, say, 5 and 7 items, you should call the remove method twice.
 * Removing a series of items from 5 to 7 could be done in a single call.
 */
export default class Remove {

  static run(scroller: Scroller, predicate: ItemsPredicate) {
    if (!isFunction(predicate)) {
      scroller.workflow.call({
        process: Process.remove,
        status: ProcessStatus.error,
        payload: { error: `Wrong argument of the "Adapter.remove" method call` }
      });
      return;
    }

    let needToUpdateView: boolean = scroller.state.clip.doClip;

    scroller.buffer.items.forEach(item => {
      if (predicate(item.get())) {
        item.toRemove = true;
        item.removeDirection = Direction.forward; // inversion, will alway increase fwd padding
        scroller.state.clip.doClip = scroller.state.clip.simulate = needToUpdateView = true;
      }
    });

    // if no items are to be removed, we don't need to change the view at all, so removing is done
    if (!needToUpdateView) {
      scroller.workflow.call({
        process: Process.remove,
        status: ProcessStatus.done
      });
      return;
    }

    scroller.workflow.call({
      process: Process.remove,
      status: ProcessStatus.next
    });
  }
}
