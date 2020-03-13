import {
  Component, OnInit, OnDestroy,
  TemplateRef, ElementRef,
  ChangeDetectionStrategy, ChangeDetectorRef, Inject
} from '@angular/core';

import { Workflow } from './component/workflow';
import { IDatasource } from './component/interfaces/index';
import { Datasource } from './component/classes/datasource';
import { Item } from './component/classes/item';
import { VersionToken } from './ui-scroll.module';
import { LoggerService } from './logger.service';

/* tslint:disable:component-selector */
@Component({
  selector: '[ui-scroll]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-padding-backward></div>
    <div
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
    </div>
    <div data-padding-forward></div>`
})
export class UiScrollComponent implements OnInit, OnDestroy {

  // come from the directive
  public template: TemplateRef<any>;
  public datasource: IDatasource | Datasource;

  // the only template variable
  public items: Item[] = [];

  // Component-Workflow integration
  public workflow: Workflow;

  constructor(
    public changeDetector: ChangeDetectorRef,
    public elementRef: ElementRef,
    private logger: LoggerService,
    @Inject(VersionToken) public version: string
  ) {
  }

  ngOnInit() {
    this.workflow = new Workflow(
      this.elementRef.nativeElement,
      this.datasource,
      this.version,
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
