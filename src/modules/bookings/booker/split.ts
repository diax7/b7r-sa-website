/**
 * The split confirm (ADR-063), as a state machine the times pane runs: a tap on a time
 * splits its row into the time and «أكّد», a tap on the armed time closes it again, a tap on
 * another time moves the split there, a pointer anywhere else collapses it, and the day's
 * change or a refresh clears it. Never a focus-out: a keyboard user Tabs from the time to
 * the confirm without the row closing under them (the pane collapses on pointer only).
 */
export interface SplitState {
  /** The ISO start whose confirm half is showing, or none. */
  armed: string | null;
}

export type SplitEvent =
  | { type: 'press'; slot: string }
  | { type: 'pointerOutside' }
  | { type: 'dayChanged' }
  | { type: 'refreshed' };

export const SPLIT_IDLE: SplitState = { armed: null };

export function reduceSplit(state: SplitState, event: SplitEvent): SplitState {
  switch (event.type) {
    case 'press':
      return state.armed === event.slot ? SPLIT_IDLE : { armed: event.slot };
    case 'pointerOutside':
    case 'dayChanged':
    case 'refreshed':
      return state.armed === null ? state : SPLIT_IDLE;
  }
}

/** Whether a pointer landed outside the armed row: the target is not inside `row`. */
export function landedOutside(row: Element | null, target: EventTarget | null): boolean {
  return !(row && target instanceof Node && row.contains(target));
}
