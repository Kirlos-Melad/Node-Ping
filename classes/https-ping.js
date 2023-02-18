// Libraries
import https from "https";

// Modules
import IPing from "../interfaces/IPing.js";

class HttpsPing extends IPing {
	constructor() {
		super();
	}

	Ping(url, { path, port, headers, threshhold }) {
		const options = {
			method: "HEAD",

			hostname: url,
			path: path,
			port: port,

			headers: headers,
		};

		const response = https.request(options);

		console.log(response);

		response.end();
	}
}

export default HttpsPing;
