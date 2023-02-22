// Libraries
import express from "express";
import ServerError from "../classes/server-error.js";
import { LogType } from "../documents/System/logs.document.js";
import serverHelper from "../helpers/server.helper.js";
import AuthenticationMiddleware from "../middlewares/authentication.middleware.js";
import ExcludePathsMiddleware from "../middlewares/exclude-paths.middleware.js";

// Modules
import UsersRouter, { users_path } from "./users.routers.js";

const RootRouter = express.Router();

const root_path = {
	users: "/users",
};

const users_excludes = [
	// Allow logging in for the users
	{ methods: ["POST"], path: root_path.users + users_path.signup },
	{ methods: ["POST"], path: root_path.users + users_path.signin },
];
RootRouter.use(
	root_path.users,
	ExcludePathsMiddleware(AuthenticationMiddleware, ...users_excludes),
	UsersRouter,
);

// Handle invalid routes
RootRouter.use(
	/**
	 *
	 * @param {Request} request
	 * @param {Response} response
	 */
	async (request, response) => {
		response
			.status(404)
			.json(
				await serverHelper.CreateResponse(
					LogType.CLIENT_ERROR,
					request,
					serverHelper.ResponseStatus.FAILURE,
					"Invalid route",
					new ServerError(
						ServerError.CustomNames.INVALID_ROUTE,
						`Can't ${request.method} ${
							request.originalUrl.split("?")[0]
						}`,
						ServerError.Handlers.CLIENT,
					),
				),
			);
	},
);

export default RootRouter;
export { root_path };
