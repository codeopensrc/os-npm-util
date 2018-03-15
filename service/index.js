"use strict";

const http = require("http");
const fs = require("fs")
const os = require("os");

const yaml = require("js-yaml");

const yamlFile = fs.readFileSync("/home/app/docker-compose.yml")
const yamlObj = yaml.safeLoad(yamlFile)

const MAIN_SERVICE = process.env.DEV_ENV ? yamlObj.services.dev : yamlObj.services.main

const DOCKER_IMAGE = MAIN_SERVICE.image
const IMAGE_VER = DOCKER_IMAGE.match(/:(.+)/)[1]
const SERVICE_NAME = process.env.SERVICE_NAME || DOCKER_IMAGE.match(/\/(\w+):/)[1]

const SERVICE_PORTS = MAIN_SERVICE.ports[0].split(":")
const SERVICE_PORT = SERVICE_PORTS.filter((port) => /^\d+$/.exec(port))[0]

// This is dockers default docker0 bridge - Keeping hardcoded until its a problem
const bridgeIP = "172.17.0.1"
const consulAPIPort = 8500;


let DOMAIN = ""
// NOTE: For backwards compat, still support /domain/name.json for now
if(fs.existsSync(`${process.cwd()}/domain/name.json`)) {
    DOMAIN = require(`${process.cwd()}/domain/name.json`).domain
}
else if (fs.existsSync(`/run/secrets/domainname`)) {
    const domainfile = fs.readFileSync("/run/secrets/domainname", "utf8")
    DOMAIN = domainfile ? JSON.parse(domainfile).domain : ""
}
else {
    DOMAIN = "localhost"
}

const CONSUL_CHECK_UUID = os.hostname();

module.exports = {

    IMAGE_VER: IMAGE_VER,
    SERVICE_NAME: SERVICE_NAME,
    SERVICE_PORT: SERVICE_PORT,
    CONSUL_CHECK_UUID: CONSUL_CHECK_UUID,

    sendToCatalog: function ({metadata, definition, path}, respond) {
        let opts = {
            method: "PUT",
            port: consulAPIPort,
            path: path,
            hostname: bridgeIP
        }
        let response = "";
        let req = http.request(opts, (res) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => { response += chunk.toString(); });
            res.on('error', (e) => { console.log("ERR - SERVICE.REGISTER1:", e) });
            res.on('end', () => {
                definition === "service" && console.log(`Registered service: ${SERVICE_NAME}!`);
                definition === "check" && console.log(`Registered check for ${SERVICE_NAME}!`);
                // definition === "passOrFail" && console.log(`${SERVICE_NAME} check passed!`);
                definition === "deregister" && console.log(`Deregistered ${SERVICE_NAME}!`);
                response && console.log("Res:", response);
                respond && respond(response)
            });
        })
        req.on("error", (e) => { console.log("ERR - SERVICE.REGISTER2:", e) })
        req.end(JSON.stringify(metadata))
    },

    register: function(isDevEnv) {
        // opts = opts && Object.keys(opts).length > 1 ? opts : {}
        // !opts.check && (opts.check = {})

        const ADDR = isDevEnv
            ? "http://localhost:"+SERVICE_PORT
            : `https://${SERVICE_NAME}`

        let service = {
            definition: "service",
            path: `/v1/agent/service/register`,
            metadata: {
                "ID": SERVICE_NAME,
                "Name": SERVICE_NAME,
                "Tags": [ IMAGE_VER ],
                "Address": ADDR,
                "Port": +SERVICE_PORT,
                "EnableTagOverride": false
            }
        }
        console.log(`Registering service: `+SERVICE_NAME);
        this.sendToCatalog(service)


        let short_container_id = CONSUL_CHECK_UUID.substr(0, 5)
        let check = {
            definition: "check",
            path: `/v1/agent/check/register`,
            metadata: {
                "ID": CONSUL_CHECK_UUID,
                "Name": `${SERVICE_NAME}_v${IMAGE_VER}_${short_container_id}`,
                "Notes": `${SERVICE_NAME} does a curl internally every 5 seconds`,
                "TTL": "15s",
                "Service_ID": SERVICE_NAME
            }
        }
        console.log("Registering check for: "+SERVICE_NAME);
        this.sendToCatalog(check)

    },

    deregisterCheck: function(check, respond) {
        console.log("Deregistering "+check);
        let checkToDegister = {
            definition: "deregister",
            path: `/v1/agent/check/deregister/${check}`,
            metadata: {}
        }
        this.sendToCatalog(checkToDegister, respond)
    }

    // deregisterService: function(service, respond) {
    //     console.log("Deregistering "+service);
    //     let serviceToDegister = {
    //         definition: "deregister",
    //         path: `/v1/agent/service/deregister/${service}`,
    //         metadata: {}
    //     }
    //     this.sendToCatalog(serviceToDegister, respond)
    // }

}
