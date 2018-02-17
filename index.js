
module.exports = {
    // Server
    get auth() { return module.require('./auth/index.js') },
    get service() { return module.require('./service/index.js'); },

    // Client
    get api() { return require('./api/index.js'); },
    get Menu() { return require('./menu/index.jsx'); },
}
