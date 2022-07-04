const { WebSocketServer } = require("ws");
const { randomBytes } = require("crypto");

const wss = new WebSocketServer({
	port: process.env.PORT ?? 8080,
});

class Stream {
	/**
	 *
	 * @param {"youtube" | "twitch"} [service] The service on which the stream is
	 * @param {string} [resource] The resource of the stream (videoid for youtube, channel for twitch)
	 */
	constructor(service, resource) {
		this.service = service;
		this.resource = resource;
	}
}

class WatchParty {
	/**
	 *
	 * @param {Stream} [host] The host stream (optional)
	 * @param {Stream} [stream] The stream the party is watching (optional)
	 */
	constructor(host, stream) {
		this.listeners = [];
		this.host = host ?? new Stream();
		this.stream = stream ?? new Stream();
		this.timestamp = 0;
	}

	addListener(cb) {
		this.listeners.push(cb);
	}

	pauseStream(extraData) {
		this.listeners.forEach((listener) =>
			listener("pause", { timestamp: this.timestamp }, extraData),
		);
	}

	playStream(extraData) {
		this.listeners.forEach((listener) =>
			listener("play", { timestamp: this.timestamp }, extraData),
		);
	}

	broadcastInfo() {
		this.listeners.forEach((listener) =>
			listener("info", {
				stream: {
					service: this.stream.service,
					resource: this.stream.resource,
				},
				host: {
					service: this.host.service,
					resource: this.host.resource,
				},
				timestamp: this.timestamp,
			}),
		);
	}

	return() {
		this.listeners.forEach((listener) => {
			listener("return", {
				service: this.host.service,
				resource: this.host.resource,
			});
		});
	}
}

/**@type{Record<string,WatchParty>} */
let parties = {};

wss.on("connection", (socket, request) => {
	const arguments = request.url.split("/").slice(1);
	console.log(arguments);
	if (!arguments.length) return socket.close(1002);
	switch (arguments[0]) {
		case "create":
			const newParty = new WatchParty();
			const code = randomBytes(10).toString("base64url");
			parties[code] = newParty;
			socket.on("message", (messageData, isBinary) => {
				if (isBinary) return;
				/**@type {{type: "pause" | "play" | "setstream", data: any, utc: number}} */
				const data = JSON.parse(messageData.toString());
				switch (data.type) {
					case "pause":
						newParty.timestamp = data.data.timestamp;
						newParty.pauseStream({ utc: data?.utc });
						break;
					case "play":
						newParty.timestamp = data.data.timestamp;
						newParty.playStream({ utc: data?.utc });
						break;
					case "setstream":
						newParty.stream.resource = data.data.resource;
						newParty.stream.service = data.data.service;
						newParty.timestamp = data.data.timestamp ?? 0;
						newParty.broadcastInfo();
						break;
					case "sethost":
						newParty.host.resource = data.data.resource;
						newParty.host.service = data.data.service;
						newParty.broadcastInfo();
						break;
					case "return":
						newParty.return();
						break;
					default:
						return;
				}
			});
			socket.send(code);
			break;
		case "listen":
			if (!arguments[1]) return socket.close(1002);
			if (!(arguments[1] in parties)) return socket.close(1011);

			const party = parties[arguments[1]];

			party.addListener((type, data, extraData) => {
				socket.send(JSON.stringify({ type, data, ...extraData }));
			});
			socket.send(
				JSON.stringify({
					type: "info",
					data: {
						stream: {
							service: party.stream?.service,
							resource: party.stream?.resource,
						},
						host: {
							service: party.host?.service,
							resource: party.host?.resource,
						},
						timestamp: party.timestamp,
					},
				}),
			);

			break;
		default:
			return socket.close(1002);
	}
});

console.log("hi");
