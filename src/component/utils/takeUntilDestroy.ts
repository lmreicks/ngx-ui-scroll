/**
 * Taken from https://github.com/NetanelBasal/ngx-take-until-destroy/blob/master/src/take-until-destroy.ts
 */
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// tslint:disable-next-line:no-any
function isFunction(value: any): boolean {
    return typeof value === 'function';
}

/**
 * Rxjs operator to unsubscribe from an observable on destroy of a component
 *
 * @example
 * 		observable.pipe(
 * 			takeUntilDestroy(this)
 * 		).subscribe();
 *
 * @requires ngOnDestroy - must be implemented in the component for the operator to work
 * @param componentInstance - this
 * @param destroyMethodName - optional destory method name, if not specified: ngOnDestroy
 */
export const takeUntilDestroy = (
    componentInstance: any,
    destroyMethodName = 'ngOnDestroy'
) => <T>(source: Observable<T>) => {
    const originalDestroy = componentInstance[destroyMethodName];
    if (isFunction(originalDestroy) === false) {
        throw new Error(
            `${
            componentInstance.constructor.name
            } is using untilDestroyed but doesn't implement ${destroyMethodName}`
        );
    }
    if (!componentInstance['__takeUntilDestroy']) {
        componentInstance['__takeUntilDestroy'] = new Subject();

        componentInstance[destroyMethodName] = function (): void {
            if (isFunction(originalDestroy)) {
                originalDestroy.apply(this, arguments);
            }
            componentInstance['__takeUntilDestroy'].next(true);
            componentInstance['__takeUntilDestroy'].complete();
        };
    }
    return source.pipe(takeUntil<T>(componentInstance['__takeUntilDestroy']));
};
