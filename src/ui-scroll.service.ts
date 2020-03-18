import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';
import { Observable, timer, merge } from 'rxjs';
import { Workflow } from './component/workflow';
import { Settings } from './component/classes/settings';
import { switchMapTo, skipUntil, map, tap, mergeScan } from 'rxjs/operators';
import { ProcessSubject, Process, ProcessStatus } from './component/interfaces';
import { Init } from './component/processes';

@Injectable()
export class UiScrollService {
    constructor(private loggerService: LoggerService) {}

    // public startWorkFlow(scrollEvent$: Observable<Event>, adapter$: Observable<ProcessSubject>, settings: Settings): Workflow {
    //     const scrollProcess$: Observable<ProcessSubject> = scrollEvent$.pipe(
    //         map(event => ({ process: Process.scroll, status: ProcessStatus.start, payload: { event } }))
    //     );

    //     const scroll$ = merge(scrollProcess$, adapter$).pipe(
    //         skipUntil(timer(settings.initializeDelay))
    //         // when one of these input things happen, we want to call the init process
    //         // init process calls all other stuff
    //         mergeScan((state, process) => )
    //     );
    // }
}
