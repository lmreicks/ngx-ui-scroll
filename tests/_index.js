import 'core-js';
import 'zone.js/dist/zone';
import 'zone.js/dist/long-stack-trace-zone';
import 'zone.js/dist/proxy.js';
import 'zone.js/dist/sync-test';
import 'zone.js/dist/jasmine-patch';
import 'zone.js/dist/async-test';
import 'zone.js/dist/fake-async-test';

import { getTestBed } from '@angular/core/testing';
import {
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

import 'rxjs';
import { config } from 'rxjs';

config.useDeprecatedSynchronousErrorHandling = true;

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

const testContext = require.context(
  './',
  false,
  /(common|datasource\-get|initial\-load|scroll\-basic|min\-max\-indexes|eof|dynamic\-size|bug|adapter\.reload|adapter\.prepend|dynamic\-height\-reload|dynamic\-height\-scroll|adapter\.append\-prepend|adapter\.check|adapter\.remove|adapter\.clip|validation|adapter\.insert)\.spec\.ts/
  //(adapter\.insert)\.spec\.ts/
);

function requireAll(requireContext) {
  return requireContext.keys().map(requireContext);
}

requireAll(testContext);
