import { Directive, Input, TemplateRef, ViewContainerRef, ComponentFactoryResolver, OnInit, OnDestroy } from '@angular/core';

import { UiScrollComponent } from './ui-scroll.component';
import { IDatasource } from './component/interfaces/datasource';
import { UiScrollViewportDirective } from './ui-scroll-viewport.directive';
import { UiScrollPaddingComponent } from './ui-scroll-padding.component';

@Directive({ selector: '[uiScroll][uiScrollOf]' })
export class UiScrollDirective implements OnInit, OnDestroy {
  private datasource: IDatasource;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private resolver: ComponentFactoryResolver,
    public viewport: UiScrollViewportDirective,
  ) {
  }

  @Input() set uiScrollOf(datasource: IDatasource) {
    this.datasource = datasource;
  }

  ngOnInit() {
    // TODO: defintetly need a better way of doing this
    const compFactory = this.resolver.resolveComponentFactory(UiScrollComponent);
    const paddingFactory = this.resolver.resolveComponentFactory(UiScrollPaddingComponent);

    const settings = this.datasource.settings || { horizontal: false };

    const paddingBackward = this.viewContainer.createComponent(paddingFactory);
    paddingBackward.instance.position = 'backward';
    paddingBackward.instance.horizontal = settings.horizontal || false;

    const componentRef = this.viewContainer.createComponent(
      compFactory, undefined, this.viewContainer.injector
    );
    componentRef.instance.datasource = this.datasource;
    componentRef.instance.template = this.templateRef;
    componentRef.instance.backwardPadding = paddingBackward.instance;
    componentRef.instance.viewport = this.viewport;

    const paddingForward = this.viewContainer.createComponent(paddingFactory);
    paddingForward.instance.position = 'forward';
    paddingForward.instance.horizontal = settings.horizontal || false;

    componentRef.instance.forwardPadding = paddingForward.instance;
  }

  ngOnDestroy(): void { }
}
