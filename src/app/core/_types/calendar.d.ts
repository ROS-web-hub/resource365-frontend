// @event-calendar does not provide typings out of the box
// so typescript will give error if we leave it that way
// we need to add typings declarations our selves to override the errors

declare module '@event-calendar/core';
// declare module '@event-calendar/time-grid';
// declare module '@event-calendar/day-grid';
// declare module '@event-calendar/list';
// declare module '@event-calendar/resource-time-grid';