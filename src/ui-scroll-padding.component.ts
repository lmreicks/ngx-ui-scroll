import { Component, HostBinding, ElementRef, Input } from '@angular/core';
import { Direction, Settings } from './component/interfaces';

@Component({
  selector: 'ui-scroll-padding',
  template: '',
  styles: [':host { display: block }']
})
export class UiScrollPaddingComponent {
  @HostBinding('attr.position') position: string;

  @Input() horizontal: boolean;

  public element: HTMLElement;

  constructor(elementRef: ElementRef) {
    this.element = elementRef.nativeElement;
  }

  get direction(): Direction {
    return this.position === 'backward' ? Direction.backward : Direction.forward;
  }

  reset(size?: number) {
    this.size = size || 0;
  }

  get size(): number {
    const size = this.element.style[this.horizontal ? 'width' : 'height'];
    return parseInt(<string>size, 10) || 0;
  }

  set size(value: number) {
    value = Math.max(0, value);
    this.element.style[this.horizontal ? 'width' : 'height'] = `${value}px`;
  }
}
