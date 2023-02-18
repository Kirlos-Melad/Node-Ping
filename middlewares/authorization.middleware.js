// Modules
import ServerError from "../classes/server-error.js";
import { LogType } from "../documents/logs.document.js";
import serverHelper from "../helpers/server.helper.js";

/**
 *
 * @param {String[]} user_roles user roles
 * @param {String[]} roles roles to be campared with
 * @returns
 */
function IsExist(user_roles, roles) {
	return user_roles.some((user_role) =>
		roles.some((role) => user_role === role),
	);
}

/**
 *
 * @param {String[]} roles the roles to be compared with the user roles
 * @param {Boolean} is_whitelist determines if the roles should be accepted or rejected upon finding them in the user roles
 *
 * @returns Function
 */
function AuthorizationMiddleware(roles, is_whitelist) {
	return async (request, response, next) => {
		try {
			const { roles: user_roles } = request.auth.user;
            
			if (IsExist(user_roles, roles) !== is_whitelist)
				throw new ServerError(
					ServerError.CustomNames.UNAUTHORIZED,
					`You don't have the right permissions to access the requested resources`,
					ServerError.Handlers.CLIENT,
				);

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
							serverHelper.ResponseStatus.PERMISSION_DENIED,
							"Access Denied",
							error,
						),
					);
			// Else return the error after converting it to Server Error
			else
				response
					.status(401)
					.json(
						await serverHelper.CreateResponse(
							LogType.CLIENT_ERROR,
							request,
							serverHelper.ResponseStatus.PERMISSION_DENIED,
							"Access Denied",
							ServerError.CreateFromError(
								error,
								ServerError.Handlers.CLIENT,
							),
						),
					);
		}
	};
}

export default AuthorizationMiddleware;
