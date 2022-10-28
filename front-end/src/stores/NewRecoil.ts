import { clientFetcher } from '@toa-lib/client';
import { Event, isEventArray } from '@toa-lib/models';
import { atom, selector } from 'recoil';

/**
 * @section UI STATE
 * Recoil state management for global UI interactions
 */
export const snackbarOpenAtom = atom<boolean>({
  key: 'snackbarOpenAtom',
  default: false
});
export const snackbarMessageAtom = atom<string>({
  key: 'snackbarMessageAtom',
  default: ''
});

/**
 * @section SELECTION STATE
 * Recoil state management for selecting data
 */
export const currentEventAtom = atom<Event | null>({
  key: 'currentEventAtom',
  default: null
});

/**
 * @section EVENT STATE
 * Recoil state management for various events
 */
// Private selector that shouldn't be globally available
const eventsSelector = selector<Event[]>({
  key: 'eventsSelector',
  get: async () => {
    try {
      const events = await clientFetcher(
        'event',
        'GET',
        undefined,
        isEventArray
      );
      console.log(events);
      return events;
    } catch (e) {
      console.log(e);
      return [];
    }
  }
});

export const eventsAtom = atom<Event[]>({
  key: 'eventsAtom',
  default: eventsSelector
});
