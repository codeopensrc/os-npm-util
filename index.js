
module.exports = {
    // Server
    get auth() { return module.require('./auth/index.js') },
    get service() { return module.require('./service/index.js'); },

    // Client
    get api() { return require('./api/api.js'); },
    get events() { return require('./api/events.js'); },
    get ErrorHandler() { return require('./api/ErrorHandler.jsx'); },
    get Menu() { return require('./menu/index.jsx'); },
}
