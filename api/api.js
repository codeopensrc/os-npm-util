"use strict";

import { events } from "../client.js"

const getCookie = (name) => {
    return document.cookie.split('; ').reduce((acc, v) => {
        const split = v.split('=')
        return split[0] === name ? decodeURIComponent(split[1]) : acc
    }, '')
}

function checkForServerErr(response) {
    if(typeof(response.status) === "string" && response.status.toLowerCase() === "error") { throw response; }
    return response;
}

function handlerErr(type, err) {
    events.trigger("error", {type: type, err: err})
    console.error("From:", type, "Err:", err);
}

window.HOST = location.protocol+"//"+location.host;


// TODO: Check the return status of our call. If we get a 404 try again X times
//   until we either get a response or hit the retry limit.
//  On a reverse proxy server we should actually try capturing any 404's (if they make it there)
//      and retrying on another docker task (if it works that way)

const api = {

    get: function(type, opts, callback) {
        if(typeof(opts) === "function") { callback = opts; opts = {} }
        if(type.charAt(0) !== "/") { type = `/${type}`; }
        opts.type = type
        let returnAs = opts.returnAs || "json"

        let request = {
            method: "GET",
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
        .then(checkForServerErr)
        .then(callback)
        .catch((err) => { handlerErr(type, err) })
    },

    post: function(type, opts, callback) {
        if(typeof(opts) === "function") { callback = opts; opts = {} }
        if(type.charAt(0) !== "/") { type = `/${type}`; }
        opts.type = type
        let request = {
            method: "POST",
            body: JSON.stringify(opts),
            headers: {
                "Auth-Email": getCookie("Auth-Email"),
                "Auth-Key": getCookie("Auth-Key"),
            }
        }
        fetch(`${HOST}/api/post`+type, request)
        .then((r) => r.json())
        .then(checkForServerErr)
        .then(callback)
        .catch((err) => { handlerErr(type, err) })
    },

    put: function(type, opts, callback) {
        if(typeof(opts) === "function") { callback = opts; opts = {} }
        if(type.charAt(0) !== "/") { type = `/${type}`; }
        opts.type = type
        let request = {
            method: "PUT",
            body: JSON.stringify(opts),
            headers: {
                "Auth-Email": getCookie("Auth-Email"),
                "Auth-Key": getCookie("Auth-Key"),
            }
        }
        fetch(`${HOST}/api/put`+type, request)
        .then((r) => r.json())
        .then(checkForServerErr)
        .then(callback)
        .catch((err) => { handlerErr(type, err) })
    },
}

export { api as default };
