import { NgModule, ModuleWithProviders, InjectionToken } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiScrollComponent } from './ui-scroll.component';
import { UiScrollDirective } from './ui-scroll.directive';
import { DevSettings } from './component/interfaces';
import { LoggerService } from './logger.service';
import version from './ui-scroll.version';

@NgModule({
  declarations: [
    UiScrollComponent,
    UiScrollDirective
  ],
  imports: [CommonModule],
  entryComponents: [UiScrollComponent],
  exports: [UiScrollDirective]
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

export const VersionToken = new InjectionToken<string>('UiScrollVersion');
export const DevConfigToken = new InjectionToken<DevSettings>('DevSettings');
