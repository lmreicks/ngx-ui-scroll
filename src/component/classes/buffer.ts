import { BehaviorSubject } from 'rxjs';

import { Direction } from '../interfaces/index';
import { Cache } from './cache';
import { Item } from './item';
import { Settings } from './settings';
import { LoggerService } from '../../logger.service';

export class Buffer {

  private _items: Array<Item>;
  /**
   * Observable of the items to be displayed
   */
  $items: BehaviorSubject<Array<Item>>;

  pristine: boolean;
  cache: Cache;
  minIndexUser: number;
  maxIndexUser: number;
  absMinIndex: number;
  absMaxIndex: number;

  private startIndex: number;
  readonly minBufferSize: number;

  constructor(settings: Settings, startIndex: number, readonly logger: LoggerService) {
    // TODO: make this a part of the workflow
    this.$items = new BehaviorSubject<Array<Item>>([]);
    this.cache = new Cache(settings.itemSize, logger);
    this.minIndexUser = settings.minIndex;
    this.maxIndexUser = settings.maxIndex;
    this.reset();
    this.startIndex = startIndex;
    this.minBufferSize = settings.bufferSize;
  }

  reset(reload?: boolean, startIndex?: number) {
    if (reload) {
      this.items.forEach(item => item.hide());
    }
    this.items = [];
    this.pristine = true;
    this.cache.reset();
    this.absMinIndex = this.minIndexUser;
    this.absMaxIndex = this.maxIndexUser;
    if (typeof startIndex !== 'undefined') {
      this.startIndex = startIndex;
    }
  }

  set items(items: Array<Item>) {
    this.pristine = false;
    this._items = items;
    this.$items.next(items);
  }

  get items(): Array<Item> {
    return this._items;
  }

  get size(): number {
    return this._items.length;
  }

  get averageSize(): number {
    return this.cache.averageSize;
  }

  get hasItemSize(): boolean {
    return this.averageSize !== undefined;
  }

  get minIndex(): number {
    return isFinite(this.cache.minIndex) ? this.cache.minIndex : this.startIndex;
  }

  get maxIndex(): number {
    return isFinite(this.cache.maxIndex) ? this.cache.maxIndex : this.startIndex;
  }

  /**
   * Indicates whether the beginning of the dataset is reached or not.
   */
  get bof(): boolean {
    return this.items.length ? (this.items[0].$index === this.absMinIndex) :
      isFinite(this.absMinIndex);
  }

  /**
   * Indicates whether the end of the dataset is reached or not.
   */
  get eof(): boolean {
    return this.items.length ? (this.items[this.items.length - 1].$index === this.absMaxIndex) :
      isFinite(this.absMaxIndex);
  }

  /**
   * Index of the first item in the view
   */
  get firstIndex(): number | null {
    return this.items.length ? this.items[0].$index : null;
  }

  /**
   * Index of the last item in the view
   */
  get lastIndex(): number | null {
    return this.items.length ? this.items[this.items.length - 1].$index : null;
  }

  /**
   * Gets an item at the index
   * @param $index Index to get item for
   */
  get($index: number): Item | undefined {
    return this.items.find((item: Item) => item.$index === $index);
  }

  setItems(items: Array<Item>): boolean {
    if (!this.items.length) {
      this.items = items;
    } else if (this.items[0].$index > items[items.length - 1].$index) {
      this.items = [...items, ...this.items];
    } else if (items[0].$index > this.items[this.items.length - 1].$index) {
      this.items = [...this.items, ...items];
    } else {
      return false;
    }
    return true;
  }

  // TODO: make this a smart merge (performance)
  append(items: Array<Item>) {
    this.items = [...this.items, ...items];
  }

  // TODO: make this a smart merge (performance)
  prepend(items: Array<Item>) {
    this.items = [...items, ...this.items];
  }

  /**
   * Removes an item from the buffer
   * @param item Item to remove
   */
  removeItem(item: Item) {
    this.items = this.items.filter((_item: Item) => _item.$index !== item.$index);
    this.items.forEach((_item: Item) => {
      if (_item.$index > item.$index) {
        _item.$index--;
        _item.nodeId = String(_item.$index);
      }
    });
    this.absMaxIndex--;
    this.cache.removeItem(item.$index);
  }

  getFirstVisibleItemIndex(): number {
    const length = this.items.length;
    for (let i = 0; i < length; i++) {
      if (!this.items[i].invisible) {
        return i;
      }
    }
    return -1;
  }

  getLastVisibleItemIndex(): number {
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (!this.items[i].invisible) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Object of ItemAdapter type containing information about first visible item,
   * where "$index" corresponds to the datasource item index value, "data" is
   * exactly the item's content, "element" is a link to DOM element which is relevant to the item.
   */
  getFirstVisibleItem(): Item | undefined {
    const index = this.getFirstVisibleItemIndex();
    if (index >= 0) {
      return this.items[index];
    }
  }

  /**
   * Object of ItemAdapter type containing information about last visible item.
   */
  getLastVisibleItem(): Item | undefined {
    const index = this.getLastVisibleItemIndex();
    if (index >= 0) {
      return this.items[index];
    }
  }

  getEdgeVisibleItem(direction: Direction, opposite?: boolean): Item | undefined {
    return direction === (!opposite ? Direction.forward : Direction.backward) ?
      this.getLastVisibleItem() : this.getFirstVisibleItem();
  }

  getVisibleItemsCount(): number {
    return this.items.reduce((acc: number, item: Item) => acc + (item.invisible ? 0 : 1), 0);
  }

  getSizeByIndex(index: number): number {
    const item = this.cache.get(index);
    return item ? item.size : this.averageSize;
  }

  checkAverageSize(): boolean {
    return this.cache.recalculateAverageSize();
  }

  getIndexToAppend(eof?: boolean): number {
    return (!eof ? (this.size ? this.items[this.size - 1].$index : this.maxIndex) : this.absMaxIndex) + (this.size ? 1 : 0);
  }

  getIndexToPrepend(bof?: boolean): number {
    return (!bof ? (this.size ? this.items[0].$index : this.minIndex) : this.absMinIndex) - (this.size ? 1 : 0);
  }

  getIndexToAdd(eof: boolean, prepend: boolean): number {
    return prepend ? this.getIndexToPrepend(eof) : this.getIndexToAppend(eof);
  }

}
