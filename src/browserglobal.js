require('core-js/stable');
require('regenerator-runtime/runtime');

const Api = require('./api');
const Ws = require('./websocket');

window.openspaceApi = (address, port, secure = false) => {
	return new Api(
		new Ws(address || 'localhost', port || 4682, secure), // Pass the secure parameter to WebSocketWrapper
		secure // Pass the secure parameter to the Api class
	);
};
