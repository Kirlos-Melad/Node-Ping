// Libraries
import JsonWebToken from "jsonwebtoken";
import CryptoJS from "crypto-js";
import crypto from "crypto";
import mongoose from "mongoose";

// Modules
import {
	server_config,
	token_config,
} from "../configurations/environment-varaibles.js";
import ServerError from "../classes/server-error.js";
import logsDocument from "../documents/System/logs.document.js";
import devicesDocument from "../documents/Users/devices.document.js";

const ResponseStatus = {
	// Used with authentication failure
	ACCESS_DENIED: "access denied",
	// Used with token expiration
	EXPIRED_TOKEN: "token expired",
	// Used with missing token
	MISSING_TOKEN: "token missing",
	// Used with token failure
	INVALID_TOKEN: "token invalid",

	// Used with authorization failure
	PERMISSION_DENIED: "permission denied",

	// Used with all requests
	SUCCESS: "success",
	FAILURE: "failure",
};

const GeneralID = {
	GUEST_ID: mongoose.Types.ObjectId("000000000000000000000002"),
};

/**
 * @param {request} client_request
 * @param {String} status
 * @param {String} title
 * @param {Object|ServerError} message
 *
 * @returns {Object} `server_response` json object of:
 * 	- `status`
 * 	- `credentials`
 * 	- `message`
 * 	- `log`
 */
async function CreateResponse(
	log_type,
	client_request,
	status,
	message,
	answer,
	credentials = undefined,
) {
	// Request information
	const { headers, params, query, body, method, originalUrl, auth } =
		client_request;

	const { error, result } = await logsDocument.Create({
		type: log_type,

		request: {
			route: originalUrl,

			headers,
			parameters: params,
			query,
			body,
		},

		operation: {
			type: method,
			result: answer,
			executer_id: auth ? auth.user.id : GeneralID.GUEST_ID,
		},

		message,
	});

	console.log(`LogERR: ${error}`);

	// Create and return server response
	return {
		server_response: {
			status,
			credentials,
			message: answer instanceof ServerError ? answer.Simplify() : answer,
			log: error ? "Failed to log the request!" : result._id,
		},
	};
}

/**
 *
 * @param {*} params
 * @returns
 */
function CreateToken({ user, client_id, token_uuid }) {
	// Base64 encoded object
	const token_base64 = JsonWebToken.sign(
		{ user, client_id, token_uuid },
		token_config.secret_key,
		{
			expiresIn: token_config.expires_in,
		},
	);

	// AES encrypted string
	const token_aes = CryptoJS.AES.encrypt(
		token_base64,
		server_config.secret_key,
	).toString();

	return token_aes;
}

/**
 *
 * @param {String} type Token type [access, refresh]
 * @param {String} token Encrypted JsonWebToken
 *
 * @returns
 */
async function VerifyToken(type, token) {
	type = `${type}_uuid`;
	const bytes = CryptoJS.AES.decrypt(token, server_config.secret_key);
	const token_base64 = bytes.toString(CryptoJS.enc.Utf8);

	const decoded_token = JsonWebToken.verify(
		token_base64,
		token_config.secret_key,
	);

	const { user, client_id, token_uuid } = decoded_token;
	const { error, result } = await devicesDocument.FindByClientId({
		user_id: user.id,
		client_id: client_id,
	});

	if (error) throw error;
	else if (!result || !result[type] || result[type] !== token_uuid) {
		throw new ServerError(
			ServerError.CustomNames.MISSING_VALUE,
			"Invalid token",
			ServerError.Handlers.CLIENT,
		);
	}

	return { user, client_id, token_uuid };
}

async function GenerateUUID() {
	// Convert timestamp to hexa
	const first_uuid64 = Date.now().toString(16);
	// Get random uuid
	const second_uuid64 = crypto.randomUUID();

	// Add both halves
	return first_uuid64 + second_uuid64;
}

export default Object.freeze({
	CreateResponse,
	CreateToken,
	VerifyToken,
	GenerateUUID,
	ResponseStatus,
});
