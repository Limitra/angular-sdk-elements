export interface BeforeOnDestroy {
  ngBeforeOnDestroy();
}

type NgxInstance = BeforeOnDestroy & Object;
type Descriptor = TypedPropertyDescriptor<Function>;
type Key = string | symbol;

export function BeforeOnDestroy(target: NgxInstance, key: Key, descriptor: Descriptor) {
  return {
    value: async function( ... args: any[]) {
      await target.ngBeforeOnDestroy();
      return descriptor.value.apply(target, args);
    }
  }
}
