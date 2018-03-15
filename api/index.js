"use strict";

const getCookie = (name) => {
    return document.cookie.split('; ').reduce((acc, v) => {
        const split = v.split('=')
        return split[0] === name ? decodeURIComponent(split[1]) : acc
    }, '')
}

function defaultMessage(type, err) {
    console.error("Unfortunately your request could not be processed. If this issue happens"+
    " again, please contact your administrator providing the following info: \n\n"+`${type} \n ${err}` )
    //TODO: Launch some event for the app to listen to and handle
}

window.HOST = location.protocol+"//"+location.host;


// TODO: Check the return status of our call. If we get a 404 try again X times
//   until we either get a response or hit the retry limit.
//  On a reverse proxy server we should actually try capturing any 404's (if they make it there)
//      and retrying on another docker task (if it works that way)

const api = {

    get: function (type, opts, callback) {
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
            if(returnAs === "string") { return r.text() }
            if(returnAs === "json") { return r.json() }
            return r.json()
        })
        .then(callback)
        .catch((err) => { defaultMessage(type, err) })
    },

    post: function (type, opts, callback) {
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
        .then(callback)
        .catch((err) => { defaultMessage(type, err) })
    },

    put: function (type, opts, callback) {
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
        .then(callback)
        .catch((err) => { defaultMessage(type, err) })
    },

}

module.exports = api
