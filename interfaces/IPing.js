import ServerError from "../classes/server-error.js";

class IPing {
	constructor() {
		if (this.constructor === IPing) {
			throw new ServerError(
				ServerError.CustomNames.INVALID_IMPLEMENTATION,
				"'IPing' is an abstract class",
				ServerError.Handlers.SERVER,
			);
		}
	}

	/**
	 *
	 * @param {String} url The URL to be pinged
	 * @param {*} options optional parameters
	 *  - `path` A specific path to be pinged
	 *  - `port` The server port number
	 *  - `headers` A list of key/value pairs custom HTTP headers to be sent with the ping request
	 *  - `threshhold` The threshold of acceptable failed requests
	 */
	async Ping(url, { path, port, headers, threshhold }) {
		throw new ServerError(
			ServerError.CustomNames.INVALID_IMPLEMENTATION,
			"You must implement 'Ping' method!",
			ServerError.Handlers.SERVER,
		);
	}
}

export default IPing;
