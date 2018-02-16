
// Server side
if(process.env.NODE_VERSION) {
    exports.auth = module.require('./auth/index.js');
    exports.service = module.require('./service/index.js');
}

// Client side
if(!process.env.NODE_VERSION) {
    exports.api = require('./api/index.js');
    exports.Menu = require('./menu/index.jsx');
}
