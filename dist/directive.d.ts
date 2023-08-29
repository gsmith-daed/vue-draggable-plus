import type { ObjectDirective, Ref } from 'vue';
import type { RefOrValue } from './types';
import { UseDraggableOptions } from './useDraggable';
type VDraggableBinding = [
    list: Ref<any[]>,
    options?: RefOrValue<UseDraggableOptions<any>>
];
export declare const vDraggable: ObjectDirective<HTMLElement, VDraggableBinding | Ref<any[]>>;
export {};
