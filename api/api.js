"use strict";

import { events } from "../client.js"

const getCookie = (name) => {
    return document.cookie.split('; ').reduce((acc, v) => {
        const split = v.split('=')
        return split[0] === name ? decodeURIComponent(split[1]) : acc
    }, '')
}

function checkForServerErr(response, signal) {
    if(typeof(response.status) === "string" && response.status.toLowerCase() === "error") { 
        controllers = controllers.filter((controller) => controller.signal !== signal)
        throw response;
    }
    return response;
}

function handlerErr(type, err) {
    if (err.name === 'AbortError') { console.log(`Api aborted fetch`) }
    else {
        events.trigger("error", {type: type, err: err})
        console.error("From:", type, "Err:", err);
    }
}

window.HOST = location.protocol+"//"+location.host;
let controllers = []

// TODO: Check the return status of our call. If we get a 404 try again X times
//   until we either get a response or hit the retry limit.
//  On a reverse proxy server we should actually try capturing any 404's (if they make it there)
//      and retrying on another docker task (if it works that way)

const api = {

    abortAllRequests: function() {
        controllers = controllers.filter((controller) => {
            controller.abort()
            return !controller.signal.aborted
        })
    },

    get: function(type, opts, callback) {
        if(typeof(opts) === "function") { callback = opts; opts = {} }
        if(type.charAt(0) !== "/") { type = `/${type}`; }
        opts.type = type
        let returnAs = opts.returnAs || "json"

        const abortcontroller = new AbortController();
        const signal = abortcontroller.signal;
        controllers.push(abortcontroller)

        let request = {
            method: "GET",
            signal: signal,
            headers: {
                "Auth-Email": getCookie("Auth-Email"),
                "Auth-Key": getCookie("Auth-Key"),
            }
        }
        fetch(`${HOST}/api/get`+type, request)
        .then((r) => {
            //TODO: Returning as text will cause a problem for checkForServerErr
            if(returnAs === "string") { return r.text() }
            if(returnAs === "json") { return r.json() }
            return r.json()
        })
        .then((res) => checkForServerErr(res, signal))
        .then((res) => {
            controllers = controllers.filter((controller) => controller.signal !== signal)
            callback(res)
        })
        .catch((err) => { handlerErr(type, err) })
    },

    post: function(type, opts, callback) {
        if(typeof(opts) === "function") { callback = opts; opts = {} }
        if(type.charAt(0) !== "/") { type = `/${type}`; }
        opts.type = type

        const abortcontroller = new AbortController();
        const signal = abortcontroller.signal;
        controllers.push(abortcontroller)

        let request = {
            method: "POST",
            signal: signal,
            body: JSON.stringify(opts),
            headers: {
                "Auth-Email": getCookie("Auth-Email"),
                "Auth-Key": getCookie("Auth-Key"),
            }
        }
        fetch(`${HOST}/api/post`+type, request)
        .then((r) => r.json())
        .then((res) => checkForServerErr(res, signal))
        .then((res) => {
            controllers = controllers.filter((controller) => controller.signal !== signal)
            callback(res)
        })
        .catch((err) => { handlerErr(type, err) })
    },

    put: function(type, opts, callback) {
        if(typeof(opts) === "function") { callback = opts; opts = {} }
        if(type.charAt(0) !== "/") { type = `/${type}`; }
        opts.type = type

        const abortcontroller = new AbortController();
        const signal = abortcontroller.signal;
        controllers.push(abortcontroller)

        let request = {
            method: "PUT",
            signal: signal,
            body: JSON.stringify(opts),
            headers: {
                "Auth-Email": getCookie("Auth-Email"),
                "Auth-Key": getCookie("Auth-Key"),
            }
        }
        fetch(`${HOST}/api/put`+type, request)
        .then((r) => r.json())
        .then((res) => checkForServerErr(res, signal))
        .then((res) => {
            controllers = controllers.filter((controller) => controller.signal !== signal)
            callback(res)
        })
        .catch((err) => { handlerErr(type, err) })
    },
}

export { api as default };
