// Libraries
import http from "http";

// Modules
import IPing from "../interfaces/IPing.js";

class HttpPing extends IPing {
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

		const response = http.request(options);

		console.log(response);

		response.end();
	}
}

export default HttpPing;
