// Libraries
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import compression from "compression";
import moment from "moment";

// Modules
import {
	port,
	mongodb_uri,
	cors_config,
} from "./configurations/environment-varaibles.js";
import ServerError from "./classes/server-error.js";
import RootRouter from "./routers/root.router.js";
import serverHelper from "./helpers/server.helper.js";
import devicesDocument from "./documents/Users/devices.document.js";
import JobScheduler from "./classes/job-scheduler.js";
import { LogType } from "./documents/System/logs.document.js";

function InitializeServer() {
	// Express express_server
	const express_server = express();

	// Middlewares
	express_server.use(cors(cors_config));
	express_server.use(compression());
	express_server.use(express.json());
	express_server.use(express.urlencoded({ extended: true }));

	// Handle Body bad format errors
	express_server.use(async (error, request, response, next) => {
		if (
			error instanceof SyntaxError &&
			error.status === 400 &&
			"body" in error
		) {
			return response
				.status(400)
				.json(
					await serverHelper.CreateResponse(
						LogType.CLIENT_ERROR,
						request,
						serverHelper.ResponseStatus.FAILURE,
						"Bad JSON format",
						ServerError.CreateFromError(
							error,
							ServerError.Handlers.CLIENT,
						),
					),
				);
		}
		next();
	});

	express_server.use(RootRouter);

	return express_server;
}

async function StartServer() {
	try {
		const server = InitializeServer();

		await mongoose.connect(mongodb_uri);
		console.log("Connected to DB");

		const job_scheduler_instance = JobScheduler.GetInstance(
			mongoose.connection,
		);

		job_scheduler_instance.Start();

		await server.listen(port, "0.0.0.0");

		console.log(`\nServer is listening on port ${port}...\n`);

		// Set moment start day of the week to saturday
		moment.updateLocale("en", { week: { dow: 6 } });

		return server;
	} catch (error) {
		console.log(`Error in connection\n${error}`);
	}
}

export default await StartServer();
