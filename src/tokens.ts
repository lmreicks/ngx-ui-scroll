import { InjectionToken } from '@angular/core';
import { DevSettings } from './component/interfaces';


export const VersionToken = new InjectionToken<string>('UiScrollVersion');
export const DevConfigToken = new InjectionToken<DevSettings>('DevSettings');
