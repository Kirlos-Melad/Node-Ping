import ServerError from "../classes/server-error.js";
import checksReportsDocument from "../documents/Checks/checks-reports.document.js";
import checksTagsDocument from "../documents/Checks/checks-tags.document.js";
import { LogType } from "../documents/System/logs.document.js";
import serverHelper from "../helpers/server.helper.js";

async function GetReports(request, response) {
	try {
		const { tags_whitelist, tags_blacklist } = request.query;
		const { error: check_err, result: check_res } =
			await checksTagsDocument.FindByTagNameList({
				tags_whitelist,
				tags_blacklist,
			});

		if (check_err) throw check_err;
		else if (!check_res)
			throw new ServerError(
				ServerError.CustomNames.MISSING_VALUE,
				"Creating checks report failed",
				ServerError.Handlers.SERVER,
			);

		const check_res_reduced = {};
		const check_id_list = check_res.map(({ _id, tags }) => {
			check_res_reduced[_id] = tags;

			return _id;
		});

		const { error: rep_err, result: rep_res } =
			await checksReportsDocument.FindByCheckIdList(check_id_list);

		if (rep_err) throw rep_err;
		else if (!rep_res)
			throw new ServerError(
				ServerError.CustomNames.MISSING_VALUE,
				"Creating checks report failed",
				ServerError.Handlers.SERVER,
			);

		response.status(201).json(
			await serverHelper.CreateResponse(
				LogType.INFORMATION,
				request,
				serverHelper.ResponseStatus.SUCCESS,
				"Created checks reports",
				rep_res.map(
					({
						check_id,
						status,
						up_time,
						down_time,
						outage_number,
						response_time,
						history,
					}) => {
						return {
							tags: check_res_reduced[check_id].tags,
							status,
							up_time,
							down_time,
							outage_number,
							availability: up_time / (up_time + down_time),
							response_time,
							history,
						};
					},
				),
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
						"Creating checks report failed",
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
						"Creating checks report failed",
						ServerError.CreateFromError(
							error,
							ServerError.Handlers.CLIENT,
						),
					),
				);
		}
	}
}

export default Object.freeze({ GetReports });
