import { Direction } from '../interfaces/direction';
import { Settings } from './settings';

export class DomHelper {

  readonly horizontal: boolean;

  constructor(settings: Settings) {
    this.horizontal = settings.horizontal;
  }

  checkElement(element: HTMLElement) {
    if (!element) {
      throw new Error('HTML element is not defined');
    }
  }

  getScrollPosition(element: HTMLElement): number {
    this.checkElement(element);
    return element[this.horizontal ? 'scrollLeft' : 'scrollTop'];
  }

  setScrollPosition(element: HTMLElement, value: number) {
    this.checkElement(element);
    value = Math.max(0, value);
    element[this.horizontal ? 'scrollLeft' : 'scrollTop'] = value;
  }

  getParams(element: HTMLElement): ClientRect {
    this.checkElement(element);
    if (element.tagName.toLowerCase() === 'body') {
      element = <HTMLElement>element.parentElement;
      return <ClientRect>{
        'height': element.clientHeight,
        'width': element.clientWidth,
        'top': element.clientTop,
        'bottom': element.clientTop + element.clientHeight,
        'left': element.clientLeft,
        'right': element.clientLeft + element.clientWidth
      };
    }
    return element.getBoundingClientRect();
  }

  getSize(element: HTMLElement): number {
    return this.getParams(element)[this.horizontal ? 'width' : 'height'];
  }

  getSizeStyle(element: HTMLElement): number {
    this.checkElement(element);
    const size = element.style[this.horizontal ? 'width' : 'height'];
    return parseInt(<string>size, 10) || 0;
  }

  setSizeStyle(element: HTMLElement, value: number) {
    this.checkElement(element);
    value = Math.max(0, value);
    element.style[this.horizontal ? 'width' : 'height'] = `${value}px`;
  }

  getRectEdge(params: ClientRect, direction: Direction, opposite?: boolean): number {
    const forward = !opposite ? Direction.forward : Direction.backward;
    return params[direction === forward ? (this.horizontal ? 'right' : 'bottom') : (this.horizontal ? 'left' : 'top')];
  }

  getEdge(element: HTMLElement, direction: Direction, opposite?: boolean): number {
    const params = this.getParams(element);
    return this.getRectEdge(params, direction, opposite);
  }

  hideElement(element: HTMLElement) {
    this.checkElement(element);
    element.style.display = 'none';
  }

  getOffset(element: HTMLElement): number {
    this.checkElement(element);
    return this.horizontal ? element.offsetLeft : element.offsetTop;
  }

}
