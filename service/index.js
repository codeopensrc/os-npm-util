"use strict";

const http = require("http");
const fs = require("fs")
const os = require("os");

const yaml = require("js-yaml");

// This is dockers default docker0 bridge - Keeping hardcoded until its a problem
const bridgeIP = "172.17.0.1"
const consulAPIPort = 8500;

// TODO: Once all apps migrated over, we can have this be a random uuid string if we like.
// That'll allow this to be used reliably outside of docker (os.hostname inside a container
// ended up creating a random, yet unique per container level check to be used across the app)
const CONSUL_CHECK_UUID = os.hostname();



module.exports = {

    IMAGE_VER: "",
    SERVICE_NAME: "",
    SERVICE_PORT: "",
    CONSUL_CHECK_UUID: CONSUL_CHECK_UUID,
    CONFIG_DEFAULTS: {
        register: false,
        composeFile: "/home/app/docker-compose.yml",
        devEvn: false,
        serviceName: ""
    },

    setConfig: function({ ...config }) {
        let { register, composeFile, devEvn, serviceName } = { ...this.CONFIG_DEFAULTS, ...config }

        if(!register) { return }

        let yamlFile = fs.readFileSync(composeFile)
        let yamlObj = yaml.safeLoad(yamlFile)

        let dockerService = devEvn ? yamlObj.services.dev : yamlObj.services.main

        let dockerImage = yamlObj["x-img"] ? yamlObj["x-img"] : dockerService.image
        this.IMAGE_VER = dockerImage.match(/:(.+)/)[1]
        this.SERVICE_NAME = serviceName
            ? serviceName
            : dockerImage.match(/(\w+):[\d\.]+$/)
                ? dockerImage.match(/(\w+):[\d\.]+$/)[1]
                : "default_service"

        let servicePorts = dockerService.ports ? dockerService.ports[0].split(":") : []
        this.SERVICE_PORT = servicePorts.filter( (port) => /^\d+$/.exec(port) )[0] || "";
    },

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
                definition === "service" && console.log(`Registered service: ${this.SERVICE_NAME}!`);
                definition === "check" && console.log(`Registered check for ${this.SERVICE_NAME}!`);
                // definition === "passOrFail" && console.log(`${this.SERVICE_NAME} check passed!`);
                definition === "deregister" && console.log(`Deregistered ${this.SERVICE_NAME}!`);
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
            ? "http://localhost:"+this.SERVICE_PORT
            : `https://${this.SERVICE_NAME}`

        let service = {
            definition: "service",
            path: `/v1/agent/service/register`,
            metadata: {
                "ID": this.SERVICE_NAME,
                "Name": this.SERVICE_NAME,
                "Tags": [ this.IMAGE_VER ],
                "Address": ADDR,
                "Port": +this.SERVICE_PORT,
                "EnableTagOverride": false
            }
        }
        console.log(`Registering service: `+this.SERVICE_NAME);
        this.sendToCatalog(service)


        let short_container_id = CONSUL_CHECK_UUID.substr(0, 5)
        let check = {
            definition: "check",
            path: `/v1/agent/check/register`,
            metadata: {
                "ID": CONSUL_CHECK_UUID,
                "Name": `${this.SERVICE_NAME}_v${this.IMAGE_VER}_${short_container_id}`,
                "Notes": `${this.SERVICE_NAME} does a curl internally every 10 seconds`,
                "TTL": "30s",
                "Service_ID": this.SERVICE_NAME
            }
        }
        console.log("Registering check for: "+this.SERVICE_NAME);
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
    },

    deregisterSelf: function(respond) {
        console.log("Deregistering "+CONSUL_CHECK_UUID);
        let checkToDegister = {
            definition: "deregister",
            path: `/v1/agent/check/deregister/${CONSUL_CHECK_UUID}`,
            metadata: {}
        }
        this.sendToCatalog(checkToDegister, respond)
    },

    sendHealthCheck: function(passOrFail) {
        // Backwards compat for an app that doesn't send a value yet
        if(!passOrFail || passOrFail === "") { passOrFail = "pass" }
        let TTL = {
            definition: "passOrFail",
            path: `/v1/agent/check/${passOrFail}/${CONSUL_CHECK_UUID}`,
        }
        this.sendToCatalog(TTL)
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
