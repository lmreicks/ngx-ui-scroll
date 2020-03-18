import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiScrollComponent, UiScrollItemComponent } from './ui-scroll.component';
import { UiScrollDirective } from './ui-scroll.directive';
import { DevSettings } from './component/interfaces';
import { LoggerService } from './logger.service';
import version from './ui-scroll.version';
import { defaultDevSettings } from './component/classes/settings';
import { DevConfigToken, VersionToken } from './tokens';
import { UiScrollViewportDirective } from './ui-scroll-viewport.directive';
import { UiScrollPaddingComponent } from './ui-scroll-padding.component';

@NgModule({
  declarations: [
    UiScrollViewportDirective,
    UiScrollComponent,
    UiScrollDirective,
    UiScrollItemComponent,
    UiScrollPaddingComponent
  ],
  imports: [CommonModule],
  entryComponents: [UiScrollComponent, UiScrollPaddingComponent],
  exports: [UiScrollViewportDirective, UiScrollDirective],
  providers: [
    LoggerService,
    {
      provide: DevConfigToken,
      useValue: defaultDevSettings
    },
    {
      provide: VersionToken,
      useValue: version
    }
  ]
})
export class UiScrollModule {
  static withOptions(devSettings: DevSettings): ModuleWithProviders {
    return {
      ngModule: UiScrollModule,
      providers: [
        LoggerService,
        {
          provide: DevConfigToken,
          useValue: devSettings
        },
        {
          provide: VersionToken,
          useValue: version
        }
      ]
    };
  }
}

