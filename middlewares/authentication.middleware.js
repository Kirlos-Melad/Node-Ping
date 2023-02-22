// Modules
import ServerError from "../classes/server-error.js";
import { LogType } from "../documents/System/logs.document.js";
import serverHelper from "../helpers/server.helper.js";

/**
 *
 * @param {Request} request
 * @param {*} response
 * @param {*} next
 * @returns
 */
async function AuthenticationMiddleware(request, response, next) {
	const token = request.headers["authorization"];

	const error_message = "Authentication failed";

	if (!token) {
		// send server response with failure status
		return response
			.status(401)
			.json(
				await serverHelper.CreateResponse(
					LogType.CLIENT_ERROR,
					request,
					serverHelper.ResponseStatus.MISSING_TOKEN,
					error_message,
					new ServerError(
						ServerError.CustomNames.MISSING_VALUE,
						"Token wasn't provided",
						ServerError.Handlers.CLIENT,
					),
				),
			);
	} else {
		try {
			const { user, client_id, token_uuid } =
				await serverHelper.VerifyToken("access", token.split(" ")[1]);

			request.auth = { user, client_id, token_uuid };

			next();
		} catch (error) {
			// Return the error As-Is if already Server Error
			if (error instanceof ServerError)
				response
					.status(401)
					.json(
						await serverHelper.CreateResponse(
							error.handler === ServerError.Handlers.SERVER
								? LogType.SERVER_ERROR
								: LogType.CLIENT_ERROR,
							request,
							serverHelper.ResponseStatus.ACCESS_DENIED,
							"Invalid credentials",
							error,
						),
					);
			// Else return the error after converting it to Server Error
			else {
				if (error.name === "TokenExpiredError") {
					response
						.status(401)
						.json(
							await serverHelper.CreateResponse(
								LogType.CLIENT_ERROR,
								request,
								serverHelper.ResponseStatus.EXPIRED_TOKEN,
								"Invalid credentials",
								ServerError.CreateFromError(
									error,
									ServerError.Handlers.CLIENT,
								),
							),
						);
				} else if (error.name === "JsonWebTokenError") {
					response
						.status(401)
						.json(
							await serverHelper.CreateResponse(
								LogType.CLIENT_ERROR,
								request,
								serverHelper.ResponseStatus.INVALID_TOKEN,
								"Invalid credentials",
								ServerError.CreateFromError(
									error,
									ServerError.Handlers.CLIENT,
								),
							),
						);
				} else {
					response
						.status(401)
						.json(
							await serverHelper.CreateResponse(
								LogType.CLIENT_ERROR,
								request,
								serverHelper.ResponseStatus.ACCESS_DENIED,
								"Invalid credentials",
								ServerError.CreateFromError(
									error,
									ServerError.Handlers.CLIENT,
								),
							),
						);
				}
			}
		}
	}
}

export default AuthenticationMiddleware;
