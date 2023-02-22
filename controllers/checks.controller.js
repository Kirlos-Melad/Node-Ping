// Libraries
import mongoose from "mongoose";
import ms from "ms";

// Modules
import checksDocument from "../documents/Checks/checks.document.js";
import ServerError from "../classes/server-error.js";
import serverHelper from "../helpers/server.helper.js";
import { LogType } from "../documents/System/logs.document.js";
import tagsDocument from "../documents/Checks/tags.document.js";
import checksTagsDocument from "../documents/Checks/checks-tags.document.js";
import JobScheduler from "../classes/job-scheduler.js";
import pingerHelper from "../helpers/pinger.helper.js";
import pollingRequestsDocument, {
	PollingRequestStatus,
} from "../documents/Checks/polling-requests.document.js";
import checksReportsDocument from "../documents/Checks/checks-reports.document.js";

async function PostChecks__CreateJob({
	_id,
	url,
	path,
	port,
	headers,
	ignore_ssl,
	threshold,
	timeout,
	interval,
}) {
	const pinger = pingerHelper.GetPinger(port);

	JobScheduler.GetInstance().CreateJob(_id.toString(), interval, async () => {
		const SaveResponse = (status_type) => {
			const response_time = Date.now() - start_time;
			pollingRequestsDocument.Create({
				check_id: _id,
				response_time: response_time,
				status: {
					type: status_type,
					time: response_time + interval,
				},
			});

			const is_up = status_type === PollingRequestStatus.UP;

			checksReportsDocument.CreateOrUpdate({
				check_id: _id,
				status: status_type,
				up_time: is_up ? response_time + interval : 0,
				down_time: is_up ? 0 : response_time + interval,
				response_time: response_time,
			});
		};

		const start_time = Date.now();
		try {
			await pinger.Ping({
				url: url,
				path: path,
				port: port,
				headers: headers,
				ignore_ssl: ignore_ssl,
				threshold: threshold,
				timeout: timeout,
			});

			SaveResponse(PollingRequestStatus.UP);
		} catch (error) {
			SaveResponse(PollingRequestStatus.DOWN);
		}
	});
}

/**
 *
 * @param {Request} request
 * @param {Response} response
 * @returns
 */
async function PostChecks(request, response) {
	// Start mongoose session
	const session = await mongoose.startSession();
	// Start the ATOMIC process
	session.startTransaction();

	try {
		const { id: user_id } = request.params;
		const {
			name,
			url,
			port,
			path,
			webhook,
			timeout, // {unit, duration}
			interval, // {unit, duration}
			threshold,
			authentication, // {username, password}
			http_headers, // {key: value}
			assert, // {key: value}
			tag_list, // string[]
			ignore_ssl,
		} = request.body;

		const { error: check_err, result: check_res } =
			await checksDocument.Create(
				{
					user_id: user_id,
					name: name,
					url: url,
					path: path,
					port: port,
					webhook: webhook,
					timeout:
						timeout && ms(`${timeout.duration} ${timeout.unit}`),
					interval:
						interval && ms(`${interval.duration} ${interval.unit}`),
					threshold,
					headers: authentication
						? {
								...http_headers,
								Authorization: `Basic ${Buffer.from(
									`${authentication.username}:${authentication.password}`,
								).toString("base64")}`,
						  }
						: http_headers,
					assert,
					ignore_ssl,
				},
				{ session },
			);

		if (check_err) throw check_err;
		else if (!check_res)
			throw new ServerError(
				ServerError.CustomNames.MISSING_VALUE,
				"Creating check failed",
				ServerError.Handlers.CLIENT,
			);

		if (!tag_list || !tag_list.length)
			throw new ServerError(
				ServerError.CustomNames.MISSING_VALUE,
				"No tags found",
				ServerError.Handlers.CLIENT,
			);

		// Find all existing tags
		const { error: tag_list_err, result: tag_list_res } =
			await tagsDocument.FindByUserId({ user_id: user_id });

		if (tag_list_err) throw tag_list_err;
		else if (!tag_list_res)
			throw new ServerError(
				ServerError.CustomNames.INVALID_VALUE,
				"Some tags doesn't exist",
				ServerError.Handlers.CLIENT,
			);

		// Check if there is no new tag
		const is_all_exist = tag_list.some((tag) =>
			tag_list_res.some(({ name: db_tag }) => tag === db_tag),
		);

		if (!is_all_exist)
			throw new ServerError(
				ServerError.CustomNames.INVALID_VALUE,
				"Some tags doesn't exist",
				ServerError.Handlers.CLIENT,
			);

		const { error: check_tag_err, result: check_tag_res } =
			await checksTagsDocument.Create({ user_id, tag_list }, { session });

		if (check_tag_err) throw check_tag_err;
		else if (!check_tag_res)
			throw new ServerError(
				ServerError.CustomNames.INVALID_VALUE,
				"Creating Check-Tag list failed",
				ServerError.Handlers.SERVER,
			);

		PostChecks__CreateJob(check_res);

		await session.commitTransaction();
		session.endSession();

		response
			.status(201)
			.json(
				await serverHelper.CreateResponse(
					LogType.INFORMATION,
					request,
					serverHelper.ResponseStatus.SUCCESS,
					"Created check",
					check_res,
				),
			);
	} catch (error) {
		// Discard the changes
		session.abortTransaction();

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
						"Creating check failed",
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
						"Signing up failed",
						ServerError.CreateFromError(
							error,
							ServerError.Handlers.CLIENT,
						),
					),
				);
		}
	}
}

export default Object.freeze({ PostChecks });
