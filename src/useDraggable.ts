import Sortable, { type Options, type SortableEvent } from 'sortablejs'
import {
  getCurrentInstance,
  isRef,
  onMounted,
  onUnmounted,
  unref
} from 'vue-demi'
import type { Ref } from 'vue-demi'
import type { Fn, RefOrElement, RefOrValue } from './types'

import { error } from './utils/log'

import {
  forEachObject,
  getElementBySelector,
  insertElement,
  insertNodeAt,
  isHTMLElement,
  isString,
  isUndefined,
  mergeOptionsEvents,
  moveArrayElement,
  removeElement,
  removeNode
} from './utils'
import { watch } from 'vue'

function defaultClone<T>(element: T): T {
  if (element === undefined || element === null) return element
  return JSON.parse(JSON.stringify(element))
}

function tryOnUnmounted(fn: Fn) {
  if (getCurrentInstance()) onUnmounted(fn)
}

function tryOnMounted(fn: Fn) {
  if (getCurrentInstance()) onMounted(fn)
  else fn()
}

const CLONE_ELEMENT_KEY = Symbol('cloneElement')

interface DraggableEvent extends SortableEvent {
  item: HTMLElement & { [CLONE_ELEMENT_KEY]: any }
}
type SortableMethod = 'closest' | 'save' | 'toArray' | 'destroy' | 'option'

export interface UseDraggableReturn extends Pick<Sortable, SortableMethod> {
  /**
   * Start the sortable.
   * @param {HTMLElement} target - The target element to be sorted.
   * @default By default the root element of the VueDraggablePlus instance is used
   */
  start: (target?: HTMLElement) => void
  pause: () => void
  resume: () => void
}

export interface UseDraggableOptions<T> extends Options {
  clone?: (element: T) => T
  immediate?: boolean
  customUpdate?: (event: SortableEvent) => void
}

/**
 * A custom hook that allows you to drag and drop elements in a list.
 * @param el
 * @param {Array} list - The list to be dragged
 * @param {Object} options - The options of the sortable
 * @returns {Object} - The return of the sortable
 */
export function useDraggable<T>(
  el: RefOrElement,
  list?: Ref<T[] | undefined>,
  options?: RefOrValue<UseDraggableOptions<T>>
): UseDraggableReturn
export function useDraggable<T>(
  el: null | undefined,
  list?: Ref<T[] | undefined>,
  options?: RefOrValue<UseDraggableOptions<T>>
): UseDraggableReturn
export function useDraggable<T>(
  el: Ref<HTMLElement | null | undefined>,
  options?: RefOrValue<UseDraggableOptions<T>>
): UseDraggableReturn
export function useDraggable<T>(
  el: null | undefined,
  options?: RefOrValue<UseDraggableOptions<T>>
): UseDraggableReturn

/**
 * A custom hook that allows you to drag and drop elements in a list.
 * @param {Ref<HTMLElement | null | undefined> | string} el
 * @param {Ref<T[]>} list
 * @param {RefOrValue<UseDraggableOptions<T>>} options
 * @returns {UseSortableReturn}
 */
export function useDraggable<T>(...args: any[]): UseDraggableReturn {
  const vm = getCurrentInstance()?.proxy

  const el = args[0]
  let [, list, options] = args

  if (!Array.isArray(unref(list))) {
    options = list
    list = null
  }

  let instance: Sortable | null = null
  const {
    immediate = true,
    clone = defaultClone,
    customUpdate
  } = unref(options) ?? {}

  /**
   * Element dragging started
   * @param {DraggableEvent} evt - DraggableEvent
   */
  function onStart(evt: DraggableEvent) {
    evt.item[CLONE_ELEMENT_KEY] = clone(unref(unref(list)?.[evt.oldIndex!]))
  }

  /**
   * Element is dropped into the list from another list
   * @param {DraggableEvent} evt
   */
  function onAdd(evt: DraggableEvent) {
    const element = evt.item[CLONE_ELEMENT_KEY]
    if (isUndefined(element)) return
    removeNode(evt.item)
    insertElement(unref(list), evt.newDraggableIndex!, element)
  }

  /**
   * Element is removed from the list into another list
   * @param {DraggableEvent} evt
   */
  function onRemove(evt: DraggableEvent) {
    const { from, item, oldIndex, oldDraggableIndex, pullMode, clone } = evt
    if (pullMode === 'clone') {
      insertNodeAt(from, item, oldIndex!)
      removeNode(clone)
      return
    }
    removeElement(unref(list), oldDraggableIndex!)
  }

  /**
   * Changed sorting within list
   * @param {DraggableEvent} evt
   */
  function onUpdate(evt: DraggableEvent) {
    if (customUpdate) {
      customUpdate(evt)
      return
    }
    const { from, item, oldIndex, oldDraggableIndex, newDraggableIndex } = evt
    removeNode(item)
    insertNodeAt(from, item, oldIndex!)
    if (isRef(list)) {
      const newList = [...unref(list)]
      list.value = moveArrayElement(newList, oldDraggableIndex!, newDraggableIndex!)
      return
    }
    moveArrayElement(unref(list), oldDraggableIndex!, newDraggableIndex!)
  }

  /**
   * preset options
   */
  const presetOptions: UseDraggableOptions<T> = {
    onUpdate,
    onStart,
    onAdd,
    onRemove
  }

  function getTarget(target?: HTMLElement) {
    const element = unref(el) as any
    if (!target) {
      target = isString(element)
        ? getElementBySelector(element, vm?.$el)
        : element
    }
    // @ts-ignore
    if (target && !isHTMLElement(target)) target = target.$el

    if (!target) error('Root element not found')
    return target
  }

  function mergeOptions() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { immediate, clone, ...restOptions } = unref(options) ?? {}
    return mergeOptionsEvents(
      list === null ? {} : presetOptions,
      restOptions
    ) as Options
  }

  const start = (target?: HTMLElement) => {
    target = getTarget(target)
    if (instance) methods.destroy()

    instance = new Sortable(target as HTMLElement, mergeOptions())
  }

  watch(
    () => options,
    () => {
      if (!instance) return
      forEachObject(mergeOptions(), (key, value) => {
        // @ts-ignore
        instance?.option(key, value)
      })
    },
    { deep: true }
  )

  const methods = {
    option: (name: keyof Options, value?: any) => {
      // @ts-ignore
      return instance?.option(name, value)
    },
    destroy: () => {
      instance?.destroy()
      instance = null
    },
    save: () => instance?.save(),
    toArray: () => instance?.toArray(),
    closest: (...args) => {
      // @ts-ignore
      return instance?.closest(...args)
    }
  } as Pick<Sortable, SortableMethod>

  const pause = () => methods?.option('disabled', true)
  const resume = () => methods?.option('disabled', false)

  tryOnMounted(() => {
    immediate && start()
  })

  tryOnUnmounted(methods.destroy)

  return { start, pause, resume, ...methods }
}
