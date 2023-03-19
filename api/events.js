"use strict";

/**
 * @module events
 */


/**
 * Object to hold functions to call on an event trigger
 * @alias module:events.eventsArr
 * @inner
 */
let eventsArr = {
    "error": [],
    "update": []
};

const events = {
    /**
     * Register a function (fn) to be called on an event (evt)
     * @param {string} evt - An event to to listen for
     * @param {string} fn - Function to call on "evt"
     * @example events.on("error", handleError)
     */
    on(evt, fn) {
        // TODO: Check if evt a string and fn a function
        events[evt].push(fn)
    },


    /**
     * Trigger an event to call all functions listening for the event
     * @param {string} evt - The event to trigger
     * @param {string|object|array|number} data - Data to pass to all functions listening
     * for the event
     * @example events.trigger("update", {from: "inbox", info: "New mail"})
     */
    trigger(evt, data) {
        if(events[evt] && events[evt].length > 0) {
            events[evt].forEach((fn, i) => fn(data))
        }
        else {
            console.error(`No functions registered for event '${evt}'`);
        }
    }
}
export { events as default };
