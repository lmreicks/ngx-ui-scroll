export enum Process {
  init = 'init',
  scroll = 'scroll',
  /**
   * Resets the items buffer, resets the viewport params and starts fetching items from "startIndex" (if set).
   */
  reload = 'adapter.reload',
  /**
   * Adds items or single item to the end of the uiScroll dataset.
   * If eof parameter is not set, items will be added and rendered immediately,
   * they will be placed right after the last item in the uiScroll buffer.
   * If eof parameter is set to true, items will be added and rendered only if the end of the dataset is reached;
   * otherwise, these items will be virtualized.
   */
  append = 'adapter.append',
  /**
   * Adds items or single item to the beginning of the uiScroll dataset.
   * If bof parameter is not set, items will be added and rendered immediately,
   * they will be placed right before the first item in the uiScroll buffer.
   * If bof parameter is set to true, items will be added and rendered only if the beginning of the dataset is reached;
   * otherwise, these items will be virtualized.
   */
  prepend = 'adapter.prepend',
  /**
   * Checks if any of current items changed it's size and runs a procedure to provide internal consistency and new items fetching if needed.
   */
  check = 'adapter.check',
  /**
   * Removes items from current buffer. Predicate is a function to be applied to every item presently in the buffer.
   * Predicate must return boolean value. If predicate's return value is true, the item will be removed.
   * Note! Current implementation allows to remove only a continuous series of items per call.
   * If you want to remove, say, 5 and 7 items, you should call the remove method twice.
   * Removing a series of items from 5 to 7 could be done in a single call.
   */
  remove = 'adapter.remove',
  /**
   * Removes out-of-viewport items on demand.
   * The direction in which invisible items should be clipped can be specified by passing an options object.
   * If no options is passed, clipping will affect both forward and backward directions.
   */
  userClip = 'adapter.clip',
  fix = 'adapter.fix',
  start = 'start',
  preFetch = 'preFetch',
  fetch = 'fetch',
  postFetch = 'postFetch',
  render = 'render',
  preClip = 'preClip',
  clip = 'clip',
  adjust = 'adjust',
  end = 'end'
}

export enum ProcessStatus {
  start = 'start',
  next = 'next',
  done = 'done',
  error = 'error'
}

export interface ScrollPayload {
  event?: Event;
  byTimer?: boolean;
}

export interface ProcessSubject {
  process: Process;
  status: ProcessStatus;
  payload?: any;
}

export interface WorkflowError {
  loop: string;
  time: number;
  message: string;
  process: Process;
}

export type CallWorkflow = (processSubject: ProcessSubject) => undefined;
