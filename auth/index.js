"use strict";

const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");

// NOTE: We use the following variables at the bottom as defaults for backwards compat

// TODO: We shouldn't read env variables in a node module, as convenient as it was, need to deprecate
const USE_AUTH = process.env.USE_AUTH ? JSON.parse(process.env.USE_AUTH) : false;
const DOMAIN = fs.existsSync(`${process.cwd()}/domain/name.json`)
    ? require(`${process.cwd()}/domain/name.json`).domain
    : "localhost"
const DEFAULT_AUTH_URL = DOMAIN === "localhost"
    ? "http://172.17.0.1:4030"
    : `https://auth.${DOMAIN}:443`

module.exports = {

    set USE_AUTH(use_auth) { this.USE_AUTH_SERVER = use_auth },
    get USE_AUTH() { return this.USE_AUTH_SERVER },

    set HOST(host) { this.HOSTNAME = host },
    get HOST() { return this.HOSTNAME },

    set PROTO(proto) { this.PROTOCOL = proto },
    get PROTO() { return this.PROTOCOL },

    set PORT(port) { this.PORT_NUM = port },
    get PORT() { return this.PORT_NUM },

    set DOMAIN(domain) { this.DOMAIN_NAME = domain },
    get DOMAIN() {
        if(!this.DOMAIN_NAME) { return DOMAIN }
        if(this.DOMAIN_NAME) { return this.DOMAIN_NAME }
    },

    set URL(authUrl) {
        this.AUTH_URL = authUrl
        this.PROTOCOL = url.parse(authUrl).protocol
        this.PORT_NUM = url.parse(authUrl).port
        this.HOSTNAME = url.parse(authUrl).hostname
    },
    get URL() {
        if(!this.AUTH_URL) { return DEFAULT_AUTH_URL }
        if(this.AUTH_URL) { return this.AUTH_URL }
    },

    checkResponse(raw, requestFrom) {
        let res = ""
        try { res = raw ? JSON.parse(raw) : "" }
        catch(e) {
            console.log(`ERR - ${requestFrom} Invalid request/url`);
            console.log(`ERR - ${requestFrom}:`, e);
            return false
        }
        return true
    },


    checkAccess({headers = {}, app, accessReq }) {
        let customHeaders = {
            "auth-email": headers["auth-email"],
            "auth-key": headers["auth-key"]
        }
        return new Promise((resolve, reject) => {
            if(!this.USE_AUTH) { return resolve({status: true, hasPermissions: true})}
            let options = {
                hostname: this.HOST,
                port: this.PORT,
                path: "/api/get/access",
                method: "GET",
                headers: customHeaders
            }
            let respondCallback = (res) => {
                let raw = ""
                res.on("data", (data) => raw += data.toString())
                res.on("err", (err) => { reject(err) })
                res.on("end", () => {
                    let responseIsOk = this.checkResponse(raw, "NPMAUTH.CHECKACCESS")
                    if(!responseIsOk) { return resolve({status: false}) }
                    let res = JSON.parse(raw)
                    let status = res.status ? res.status : false
                    let hasPermissions = status && res.access[app] >= res.access["levels"][accessReq]
                    resolve({status: status, hasPermissions})
                })
            }
            let req = this.PROTO === "http:"
                ? http.request(options, respondCallback)
                : https.request(options, respondCallback)
            req.on("error", (e) => reject(e))
            req.end();
        })
    },

    getMenu(headers = {}, respond) {
        let customHeaders = {
            "auth-email": headers["auth-email"] || "",
            "auth-key": headers["auth-key"] || ""
        }
        if(!this.USE_AUTH) { return respond({status: true, apps:[]}) }
        let options = {
            hostname: this.HOST,
            port: this.PORT,
            path: "/api/get/menu",
            method: "GET",
            headers: customHeaders
        }
        let respondCallback = (res) => {
            let raw = ""
            res.on("data", (data) => raw += data.toString())
            res.on("err", (err) => {
                console.log("ERR - AUTH.GETMENU1:\n", err);
                respond({status: false, data: "Server error"})
            })
            res.on("end", () => {
                let responseIsOk = this.checkResponse(raw, "NPMAUTH.GETMENU")
                if(!responseIsOk) { return respond({status: false}) }
                let res = JSON.parse(raw)
                if(!res.status) {
                    if(res.data) {
                        console.log(res.data);
                        return respond({status: false, data: "Server error"})
                    }
                    console.log("User has incorrect authentication credentials or server error");
                    return respond({status: false, data: "Incorrect credentials"})
                }
                respond({status: res.status, apps: res.apps})
            })
        }
        let req = this.PROTO === "http:"
            ? http.request(options, respondCallback)
            : https.request(options, respondCallback)
        req.on("error", (e) => {
            console.log("ERR - AUTH.GETMENU2:\n", e);
            respond({status: false, data: "Server error"})
        })
        req.end();
    },

    logout({headers = {}, app}) {
        let customHeaders = {
            "auth-email": headers["auth-email"],
            "auth-key": headers["auth-key"]
        }
        return new Promise((resolve, reject) => {
            if(!this.USE_AUTH) { return resolve({status: true})}
            let options = {
                hostname: this.HOST,
                port: this.PORT,
                path: "/api/post/logout",
                method: "POST",
                headers: customHeaders
            }
            let respondCallback = (res) => {
                let raw = ""
                res.on("data", (data) => raw += data.toString())
                res.on("err", (err) => { reject(err) })
                res.on("end", () => {
                    let responseIsOk = this.checkResponse(raw, "NPMAUTH.LOGOUT")
                    if(!responseIsOk) { return resolve({status: false}) }
                    let res = JSON.parse(raw)
                    resolve({status: res.status})
                })
            }
            let req = this.PROTO === "http:"
                ? http.request(options, respondCallback)
                : https.request(options, respondCallback)
            req.on("error", (e) => reject(e))
            req.end();
        })
    }
}

// Providing defaults for a few apps until theyre updated
module.exports.URL = DEFAULT_AUTH_URL
module.exports.DOMAIN = DOMAIN
module.exports.USE_AUTH = USE_AUTH

// // Example
// auth.checkAccess({headers, app: "auth", accessReq: "admin"})
// .then(({ status, hasPermissions }) => {
//     if(!status) {
//         console.log("User has incorrect authentication credentials");
//         return respond({status: false, data: "Incorrect credentials"})
//     }
//     if(!hasPermissions) {
//         console.log("User does not have required access for action");
//         return respond({status: false, data: "Insufficient priveleges"})
//     }
// })
