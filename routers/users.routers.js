// Libraries
import express from "express";

// Modules
import usersController from "../controllers/users.controller.js";
import AuthorizationMiddleware from "../middlewares/authorization.middleware.js";
import checksController from "../controllers/checks.controller.js";

const UsersRouter = express.Router();

const users_path = {
	signup: "/signup",
	signin: "/signin",

	checks: "/:id/checks",
};

UsersRouter.post(users_path.signup, usersController.PostSignUp);
UsersRouter.post(users_path.signin, usersController.PostSignIn);

UsersRouter.post(users_path.checks, async (request, response, next) => {
	AuthorizationMiddleware([request.params.id], true)(request, response, next);
}, checksController.PostChecks);

export default UsersRouter;
export { users_path };
