// Libraries
import net from "net";

// Modules
import IPing from "../interfaces/IPing.js";

class TcpPing extends IPing {
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

		const socket = new net.Socket();

		socket.connect()
	}
}
