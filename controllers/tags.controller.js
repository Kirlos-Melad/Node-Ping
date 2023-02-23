import ServerError from "../classes/server-error.js";
import tagsDocument from "../documents/Checks/tags.document.js";
import { LogType } from "../documents/System/logs.document.js";
import serverHelper from "../helpers/server.helper.js";

async function PostTags(request, response) {
	try {
		const { id } = request.params;
		const { name } = request.body;

		const { error, result } = await tagsDocument.Create({
			user_id: id,
			name: name,
		});

		if (error) throw error;
		else if (!result)
			throw new ServerError(
				ServerError.CustomNames.MISSING_VALUE,
				"Creating tag failed",
				ServerError.Handlers.SERVER,
			);

		response
			.status(201)
			.json(
				await serverHelper.CreateResponse(
					LogType.INFORMATION,
					request,
					serverHelper.ResponseStatus.SUCCESS,
					"Created tags",
					result,
				),
			);
	} catch (error) {
		if (error instanceof ServerError) {
			const is_server_handler =
				error.handler === ServerError.Handlers.SERVER;
			response
				.status(is_server_handler ? 500 : 400)
				.json(
					await serverHelper.CreateResponse(
						is_server_handler
							? LogType.SERVER_ERROR
							: LogType.CLIENT_ERROR,
						request,
						serverHelper.ResponseStatus.FAILURE,
						"Creating tag failed",
						error,
					),
				);
		} else {
			response
				.status(400)
				.json(
					await serverHelper.CreateResponse(
						LogType.SERVER_ERROR,
						request,
						serverHelper.ResponseStatus.FAILURE,
						"Creating tag failed",
						ServerError.CreateFromError(
							error,
							ServerError.Handlers.CLIENT,
						),
					),
				);
		}
	}
}

export default Object.freeze({ PostTags });
