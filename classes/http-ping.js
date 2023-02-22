// Libraries
import http from "http";

// Modules
import IPing from "../interfaces/IPing.js";

class HttpPing extends IPing {
	constructor() {
		super();
	}

	Ping({ url, path, port, headers, threshold, timeout }) {
		const options = {
			method: "GET",

			hostname: url,
			path: path,
			port: port,

			headers: headers,
		};

		return new Promise((resolve, reject) => {
			const makeRequest = () => {
				threshold--;

				const request = http.request(options, (response) => {
					if (
						response.statusCode >= 200 &&
						response.statusCode < 300
					) {
						response.on("end", () => {
							resolve(response);
						});
					} else {
						// Retry on non-2xx status codes
						if (threshold) {
							setTimeout(makeRequest, timeout);
						} else {
							reject(
								new Error(
									`HTTP request failed with status code ${response.statusCode}`,
								),
							);
						}
					}
				});

				request.on("error", (error) => {
					// Retry on connection errors
					if (threshold) {
						setTimeout(makeRequest, timeout);
					} else {
						reject(error);
					}
				});

				request.end();
			};

			makeRequest();
		});
	}
}

export default HttpPing;
