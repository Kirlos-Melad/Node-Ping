class ServerError extends Error {
	handler; // Who's Responsible for handling the error
	details; // Array of more detailed messages
	code; // Error code

	static Handlers = {
		SERVER: "server",
		CLIENT: "client",
	};

	static CustomNames = {
		PASSWORD: "PasswordError",
		MISSING_VALUE: "MissingValueError",
		DUPLICATE_VALUE: "DuplicatedValueError",
		INVALID_VALUE: "InvalidValueError",
		INVALID_FORMAT: "InvalidFormatError",
		INVALID_ROUTE: "InvalidRouteError",
		INVALID_IMPLEMENTATION: "InvalidImplementationError",

		UNAUTHORIZED: "UnauthorizedError",

		UNKNOWN: "UknownError",
	};

	/**
	 *
	 * @param {String|CustomNames} name type of error
	 * @param {String} message message describing the error
	 * @param {Handlers} handler Who's Responsible for handling the error
	 */
	constructor(name, message, handler, code = -1) {
		super(message);
		this.name = name;
		this.handler = handler;
		this.details = [];
		this.code = code;
	}

	/**
	 *
	 * @param {Error} error system raised error
	 * @param {Handlers} handler who should handle the error
	 */
	static CreateFromError(error, handler) {
		const self = new this(error.name, error.message, handler);
		// Use correct Stack !
		self.stack = error.stack;
		DetailsExtractor(self, error);

		return self;
	}

	Simplify() {
		switch (this.handler) {
			case ServerError.Handlers.SERVER:
				return "Internal Server Error";

			case ServerError.Handlers.CLIENT:
				return this.details.length > 0 ? this.details[0] : this.message;

			default:
				break;
		}
	}
}

function DetailsExtractor(self, error) {
	if (error.code) {
		self.code = error.code;
		CodesHandler(self, error);
	}

	if (error.name === "ValidationError") {
		ViolationsHandler(self, error);
	}
}

function CodesHandler(self, error) {
	switch (error.code) {
		case 11000:
			const keys = Object.keys(error.keyPattern);
			for (let key of keys) {
				self.details.push(`${key} is duplicated`);
			}
			break;

		default:
			break;
	}
}

function ViolationsHandler(self, error) {
	if (!error.errors) return;

	const violations = Object.values(error.errors);
	for (let violation in violations) {
		if (violation.name === "CastError") {
			self.details.push(
				`Expected a/an ${violation.kind} but recieved a/an ${violation.valueType}`,
			);
		} else if (violation.name === "ValidatorError") {
			self.details.push(violation.message);
		}
	}
}

export default ServerError;
