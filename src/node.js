const OpenSpaceApi = require('./api');
const Socket = require('./socket');

module.exports = (address, port, secure = false) => {
	return new OpenSpaceApi(
		new Socket(address || 'localhost', port || 4681),
		secure // Pass the secure parameter
	);
}