"use strict";

const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");

const USE_AUTH = process.env.USE_AUTH ? JSON.parse(process.env.USE_AUTH) : false;

const DOMAIN = fs.existsSync(`${process.cwd()}/domain/name.json`)
    ? require(`${process.cwd()}/domain/name.json`).domain
    : "localhost"

const AUTH_URL = DOMAIN === "localhost"
    ? "http://localmachine:4030"
    : `https://auth.${DOMAIN}:443`

const PROTO = url.parse(AUTH_URL).protocol
const PORT = url.parse(AUTH_URL).port
const HOST = url.parse(AUTH_URL).hostname

module.exports = {

    DOMAIN: DOMAIN,
    URL: AUTH_URL,
    PROTO: PROTO,
    PORT: PORT,
    HOST: HOST,

    checkAccess({headers = {}, app, accessReq }) {
        let customHeaders = {
            "auth-email": headers["auth-email"],
            "auth-key": headers["auth-key"]
        }
        return new Promise((resolve, reject) => {
            if(!USE_AUTH) { return resolve({status: true, hasPermissions: true})}
            let options = {
                hostname: HOST,
                port: PORT,
                path: "/api/get/access",
                method: "GET",
                headers: customHeaders
            }
            let respondCallback = (res) => {
                let raw = ""
                res.on("data", (data) => raw += data.toString())
                res.on("err", (err) => { reject(err) })
                res.on("end", () => {
                    let res = raw ? JSON.parse(raw) : ""
                    let status = res.status ? res.status : false
                    let hasPermissions = status && res.access[app] >= res.access["levels"][accessReq]
                    resolve({status: status, hasPermissions})
                })
            }
            let req = PROTO === "http:"
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
        if(!USE_AUTH) { return respond({status: true, apps:[]}) }
        let options = {
            hostname: HOST,
            port: PORT,
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
                let res = raw ? JSON.parse(raw) : ""
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
        let req = PROTO === "http:"
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
            if(!USE_AUTH) { return resolve({status: true})}
            let options = {
                hostname: HOST,
                port: PORT,
                path: "/api/post/logout",
                method: "POST",
                headers: customHeaders
            }
            let respondCallback = (res) => {
                let raw = ""
                res.on("data", (data) => raw += data.toString())
                res.on("err", (err) => { reject(err) })
                res.on("end", () => {
                    let res = JSON.parse(raw)
                    resolve({status: res.status})
                })
            }
            let req = PROTO === "http:"
                ? http.request(options, respondCallback)
                : https.request(options, respondCallback)
            req.on("error", (e) => reject(e))
            req.end();
        })
    }
}


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
