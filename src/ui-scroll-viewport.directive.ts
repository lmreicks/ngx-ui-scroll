import { Directive, HostListener, OnDestroy, ElementRef, Input } from '@angular/core';
import { Subject, Observable, fromEvent } from 'rxjs';
import { takeUntilDestroy } from './component/utils/takeUntilDestroy';
import { LoggerService } from './logger.service';
import { DomHelper } from './component/classes/domRoutines';
import { Paddings } from './component/classes/paddings';
import { Settings } from './component/classes/settings';
import { Direction, Process, ProcessStatus } from './component/interfaces';
import { State } from './component/classes/state';
import { Scroller } from './component/scroller';

@Directive({
  selector: '[uiScrollViewport]',
  exportAs: 'uiScrollViewport',
})
export class UiScrollViewportDirective implements OnDestroy {
  paddings: Paddings;

  /**
   * offset in pixels of where the items should start
   */
  startDelta: number; // TODO: this could be wrong, so update it if we find new info

  @Input() settings: Settings;

  readonly element: HTMLElement;
  public host: HTMLElement;
  public scrollEventElement: HTMLElement | Document;
  public scrollable: HTMLElement;
  public routines: DomHelper;
  public state: State;

  private disabled: boolean;
  private windowScroll$: Subject<Event> = new Subject();
  private elementScroll$: Subject<Event> = new Subject();

  constructor(elementRef: ElementRef, private logger: LoggerService) {
    this.element = elementRef.nativeElement;
  }

  init(scroller: Scroller): void {
    console.log(this.element);
    const { settings, state } = scroller;
    this.paddings = new Paddings(this.element, scroller.routines, scroller.settings);
    this.settings = settings;
    this.routines = scroller.routines;
    this.state = state;
    this.disabled = false;

    if (settings.windowViewport) {
      this.host = (<Document>this.element.ownerDocument).body;
      this.scrollEventElement = <Document>(this.element.ownerDocument);
      this.scrollable = <HTMLElement>this.scrollEventElement.scrollingElement;
    } else {
      this.host = <HTMLElement>this.element;
      this.scrollEventElement = this.host;
      this.scrollable = <HTMLElement>this.element;
    }

    if (settings.windowViewport && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    this.logger.stat(scroller, 'initialization');
  }

  reset(scrollPosition: number) {
    let newPosition = 0;
    this.paddings.reset(this.getSize(), this.state.startIndex);
    const negativeSize = this.paddings.backward.size;
    if (negativeSize) {
      newPosition = negativeSize;
      const { itemSize } = this.settings;
      this.state.bwdPaddingAverageSizeItemsCount = itemSize ? negativeSize / itemSize : 0;
    }
    this.scrollPosition = newPosition;
    this.state.scrollState.reset();

    this.startDelta = 0;
  }

  setPosition(value: number, oldPosition?: number): number {
    if (oldPosition === undefined) {
      oldPosition = this.scrollPosition;
    }
    if (oldPosition === value) {
      this.logger.log(() => ['setting scroll position at', value, '[cancelled]']);
      return value;
    }
    this.routines.setScrollPosition(this.scrollable, value);
    const position = this.scrollPosition;
    this.logger.log(() => ['setting scroll position at', position]);
    return position;
  }

  get scrollPosition(): number {
    return this.routines.getScrollPosition(this.scrollable);
  }

  set scrollPosition(value: number) {
    const oldPosition = this.scrollPosition;
    const newPosition = this.setPosition(value, oldPosition);
    const { syntheticScroll, scrollState } = this.state;
    syntheticScroll.push(newPosition, oldPosition, scrollState.getData());
  }

  disableScrollForOneLoop() {
    if (this.disabled) {
      return;
    }
    const { style } = this.scrollable;
    if (style.overflowY === 'hidden') {
      return;
    }
    this.disabled = true;
    const overflow = style.overflowY;
    setTimeout(() => {
      this.disabled = false;
      style.overflowY = overflow;
    });
    style.overflowY = 'hidden';
  }

  getSize(): number {
    return this.routines.getSize(this.host);
  }

  getScrollableSize(): number {
    return this.routines.getSize(this.element);
  }

  getBufferPadding(): number {
    return this.getSize() * this.settings.padding;
  }

  getElementEdge(element: HTMLElement, direction: Direction, opposite?: boolean): number {
    return this.routines.getEdge(element, direction, opposite);
  }

  getEdge(direction: Direction, opposite?: boolean): number {
    return this.routines.getEdge(this.host, direction, opposite);
  }

  getOffset(): number {
    return this.routines.getOffset(this.element);
  }

  getScrollEvent$(window: boolean): Observable<Event> {
    return (window ? this.windowScroll$ : this.elementScroll$).pipe(
      takeUntilDestroy(this)
    );
  }

  ngOnDestroy(): void { }
}
