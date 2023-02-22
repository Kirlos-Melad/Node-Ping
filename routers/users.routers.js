// Libraries
import express from "express";

// Modules
import usersController from "../controllers/users.controller.js";
import AuthorizationMiddleware from "../middlewares/authorization.middleware.js";
import checksController from "../controllers/checks.controller.js";
import checksReportsController from "../controllers/checks-reports.controller.js";

const UsersRouter = express.Router();

const users_path = {
	signup: "/signup",
	signin: "/signin",

	checks: "/:id/checks",

	reports: "/:id/reports",
};

UsersRouter.post(users_path.signup, usersController.PostSignUp);
UsersRouter.post(users_path.signin, usersController.PostSignIn);

UsersRouter.post(
	users_path.checks,
	async (request, response, next) => {
		AuthorizationMiddleware([request.params.id], true)(
			request,
			response,
			next,
		);
	},
	checksController.PostChecks,
);

UsersRouter.get(
	users_path.reports,
	async (request, response, next) => {
		AuthorizationMiddleware([request.params.id], true)(
			request,
			response,
			next,
		);
	},
	checksReportsController.GetReports,
);

export default UsersRouter;
export { users_path };
