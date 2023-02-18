// Libraries
import mongoose from "mongoose";
import validator from "validator";

// Modules
import usersDocument from "../documents/users.document.js";
import devicesDocument from "../documents/devices.document.js";
import serverHelper from "../helpers/server.helper.js";
import { LogType } from "../documents/logs.document.js";
import ServerError from "../classes/server-error.js";

/**
 *
 * @param {Request} request
 * @param {Response} response
 * @returns
 */
async function PostSignUp(request, response) {
	// Start mongoose session
	const session = await mongoose.startSession();
	// Start the ATOMIC process
	session.startTransaction();

	try {
		const { email, password, client_id } = request.body;

		const [
			{ error: user_err, result: user_res },
			access_uuid,
			refresh_uuid,
		] = await Promise.all([
			usersDocument.Create({ email, password }, { session }),
			serverHelper.GenerateUUID(),
			serverHelper.GenerateUUID(),
		]);

		if (user_err) throw user_err;
		else if (!user_res)
			throw new ServerError(
				ServerError.CustomNames.MISSING_VALUE,
				"Creating user failed",
				ServerError.Handlers.SERVER,
			);

		const { error: dev_err, result: dev_res } =
			await devicesDocument.CreateOrUpdate(
				{
					user_id: user_res._id,
					client_id: client_id,
					access_uuid: access_uuid,
					refresh_uuid: refresh_uuid,
				},
				{ session },
			);

		if (dev_err) throw dev_err;
		else if (!dev_res)
			throw new ServerError(
				ServerError.CustomNames.MISSING_VALUE,
				"Creating device failed",
				ServerError.Handlers.SERVER,
			);

		const user = {
			id: user_res._id,
			email: user_res.email,
			roles: user_res.roles,
		};

		// Create refresh/access tokens
		const [access_token, refresh_token] = await Promise.all([
			serverHelper.CreateToken({
				user: user,
				client_id: dev_res.client_id,
				token_uuid: dev_res.access_uuid,
			}),
			serverHelper.CreateToken({
				user: user,
				client_id: dev_res.client_id,
				token_uuid: dev_res.refresh_uuid,
			}),
		]);

		// User transaction complete!
		await session.commitTransaction();
		session.endSession();

		response
			.status(201)
			.json(
				await serverHelper.CreateResponse(
					LogType.INFORMATION,
					request,
					serverHelper.ResponseStatus.SUCCESS,
					"Signed up",
					user,
					{ access_token, refresh_token },
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
						"Signing up failed",
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

/**
 *
 * @param {Request} request
 * @param {Response} response
 * @returns
 */
async function PostSignIn(request, response) {
	try {
		const { email, password, client_id } = request.body;

		const [
			{ error: user_err, result: user_res },
			access_uuid,
			refresh_uuid,
		] = await Promise.all([
			usersDocument.ValidateEmailAndPassword({ email, password }),
			serverHelper.GenerateUUID(),
			serverHelper.GenerateUUID(),
		]);

		if (user_err) throw user_err;

		const { error: dev_err, result: dev_res } =
			await devicesDocument.CreateOrUpdate(
				{
					user_id: user_res._id,
					client_id: client_id,
					access_uuid: access_uuid,
					refresh_uuid: refresh_uuid,
				},
				{ session: null },
			);

		if (dev_err) throw dev_err;
		else if (!dev_res)
			throw new ServerError(
				ServerError.CustomNames.MISSING_VALUE,
				"Creating device failed",
				ServerError.Handlers.SERVER,
			);

		const user = {
			id: user_res._id,
			email: user_res.email,
			roles: user_res.roles,
		};

		// Create refresh/access tokens
		const [access_token, refresh_token] = await Promise.all([
			serverHelper.CreateToken({
				user: user,
				client_id: dev_res.client_id,
				token_uuid: dev_res.access_uuid,
			}),
			serverHelper.CreateToken({
				user: user,
				client_id: dev_res.client_id,
				token_uuid: dev_res.refresh_uuid,
			}),
		]);

		response
			.status(200)
			.json(
				await serverHelper.CreateResponse(
					LogType.INFORMATION,
					request,
					serverHelper.ResponseStatus.SUCCESS,
					"Signed in",
					user,
					{ access_token, refresh_token },
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
						"Signing in failed",
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
						"Signing in failed",
						ServerError.CreateFromError(
							error,
							ServerError.Handlers.CLIENT,
						),
					),
				);
		}
	}
}

export default Object.freeze({ PostSignUp, PostSignIn });
