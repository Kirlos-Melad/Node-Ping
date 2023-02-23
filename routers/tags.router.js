// Libraries
import express from "express";
import tagsController from "../controllers/tags.controller.js";

// Modules
import AuthorizationMiddleware from "../middlewares/authorization.middleware.js";

const TagsRouter = express.Router();

const tags_path = {
	tags: "/",
};

TagsRouter.post(tags_path.tags, tagsController.PostTag);

TagsRouter.post(
	tags_path.checks,
	async (request, response, next) => {
		AuthorizationMiddleware([request.params.id], true)(
			request,
			response,
			next,
		);
	},
	checksController.PostChecks,
);

TagsRouter.get(
	tags_path.reports,
	async (request, response, next) => {
		AuthorizationMiddleware([request.params.id], true)(
			request,
			response,
			next,
		);
	},
	checksReportsController.GetReports,
);

export default TagsRouter;
export { tags_path };
