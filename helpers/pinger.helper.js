import HttpPing from "../classes/http-ping.js";
import HttpsPing from "../classes/https-ping.js";
import TcpPing from "../classes/tcp-ping.js";

function GetPinger(port) {
	switch (port) {
		case 433:
			return new HttpsPing();
		case 80:
			return new HttpPing();
		default:
			return new TcpPing();
	}
}

export default Object.freeze({ GetPinger });
