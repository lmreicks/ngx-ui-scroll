import {
  Component, OnInit, OnDestroy,
  TemplateRef, ElementRef,
  ChangeDetectionStrategy, ChangeDetectorRef, Inject
} from '@angular/core';

import { Workflow } from './component/workflow';
import { IDatasource } from './component/interfaces/index';
import { Datasource } from './component/classes/datasource';
import { Item } from './component/classes/item';
import { LoggerService } from './logger.service';
import { Observable } from 'rxjs';
import { VersionToken } from './tokens';
import { UiScrollPaddingComponent } from './ui-scroll-padding.component';
import { UiScrollViewportDirective } from './ui-scroll-viewport.directive';
import { Paddings } from './component/classes/paddings';
import { Settings } from './component/classes/settings';
import { State } from './component/classes/state';

@Component({
  selector: 'ui-scroll-item',
  template: '<ng-content></ng-content>',
  styles: [':host { display: block }']
})
export class UiScrollItemComponent {}

/* tslint:disable:component-selector */
@Component({
  selector: '[ui-scroll]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-scroll-item
      *ngFor="let item of items"
      [attr.data-sid]="item.nodeId"
      [style.position]="item.invisible ? 'fixed' : null"
      [style.left]="item.invisible ? '-99999px' : null">
      <ng-template
        [ngTemplateOutlet]="template"
        [ngTemplateOutletContext]="{
          $implicit: item.data,
          index: item.$index,
          odd: item.$index % 2,
          even: !(item.$index % 2)
      }"></ng-template>
    </ui-scroll-item>`
})
export class UiScrollComponent implements OnInit, OnDestroy {
  public forwardPadding: UiScrollPaddingComponent;
  public backwardPadding: UiScrollPaddingComponent;

  public settings: Settings;

  public viewport: UiScrollViewportDirective;

  // come from the directive
  public template: TemplateRef<any>;
  public datasource: IDatasource | Datasource;

  // the only template variable
  public items: Item[] = [];

  // Component-Workflow integration
  public workflow: Workflow;

  public scrollEvent$: Observable<Event>;

  constructor(
    public changeDetector: ChangeDetectorRef,
    public elementRef: ElementRef,
    private logger: LoggerService,
    @Inject(VersionToken) public version: string
  ) {
  }

  ngOnInit() {
    const state = new State(this.datasource);
    this.workflow = new Workflow(
      this.datasource,
      this.viewport,
      state,
      this.logger,
      (items: Item[]) => {
        if (!items.length && !this.items.length) {
          return;
        }
        this.items = items;
        this.changeDetector.markForCheck();
      }
    );
  }

  ngOnDestroy() {
    this.workflow.dispose();
  }
}
