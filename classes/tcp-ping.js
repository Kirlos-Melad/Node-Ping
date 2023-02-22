// Libraries
import net from "net";

// Modules
import IPing from "../interfaces/IPing.js";

class TcpPing extends IPing {
	constructor() {
		super();
	}

	Ping({ url, port, threshold, timeout }) {
		const options = {
			url,
			port,
		};

		return new Promise((resolve, reject) => {
			const makeRequest = () => {
				threshold--;

				const request = net.connect(options, (socket) => {
					request.end();
					resolve(socket);
				});

				request.on("error", (error) => {
					// Retry on connection errors
					if (threshold) {
						setTimeout(makeRequest, timeout);
					} else {
						reject(error);
					}
				});
			};

			makeRequest();
		});
	}
}

export default TcpPing;
