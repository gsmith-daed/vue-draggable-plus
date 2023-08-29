import Sortable, { type Options, type SortableEvent } from 'sortablejs';
import type { Ref } from 'vue';
import type { RefOrElement, RefOrValue } from './types';
type SortableMethod = 'closest' | 'save' | 'toArray' | 'destroy' | 'option';
export interface UseDraggableReturn extends Pick<Sortable, SortableMethod> {
    /**
     * Start the sortable.
     * @param {HTMLElement} target - The target element to be sorted.
     * @default By default the root element of the VueDraggablePlus instance is used
     */
    start: (target?: HTMLElement) => void;
    pause: () => void;
    resume: () => void;
}
export interface UseDraggableOptions<T> extends Options {
    clone?: (element: T) => T;
    immediate?: boolean;
    customUpdate?: (event: SortableEvent) => void;
}
/**
 * A custom hook that allows you to drag and drop elements in a list.
 * @param el
 * @param {Array} list - The list to be dragged
 * @param {Object} options - The options of the sortable
 * @returns {Object} - The return of the sortable
 */
export declare function useDraggable<T>(el: RefOrElement, list?: Ref<T[] | undefined>, options?: RefOrValue<UseDraggableOptions<T>>): UseDraggableReturn;
export declare function useDraggable<T>(el: null | undefined, list?: Ref<T[] | undefined>, options?: RefOrValue<UseDraggableOptions<T>>): UseDraggableReturn;
export declare function useDraggable<T>(el: Ref<HTMLElement | null | undefined>, options?: RefOrValue<UseDraggableOptions<T>>): UseDraggableReturn;
export declare function useDraggable<T>(el: null | undefined, options?: RefOrValue<UseDraggableOptions<T>>): UseDraggableReturn;
export {};
