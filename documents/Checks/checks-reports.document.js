// Libraries
import mongoose from "mongoose";

// Modules
import { PollingRequestStatus } from "./polling-requests.document.js";
import ServerError from "../../classes/server-error.js";

const Schema = mongoose.Schema;

const CheckReportSchema = new Schema(
	{
		check_id: {
			type: Schema.Types.ObjectId,
			ref: "checks",
			required: [true, "{PATH} not found"],
		},

		status: {
			type: Number,
			enum: {
				values: PollingRequestStatus,
				message: "{VALUE} is not supported",
			},

			default: PollingRequestStatus.UP,
		},

		up_time: {
			type: Number,
			default: 0,
		},

		down_time: {
			type: Number,
			default: 0,
		},

		outage_number: {
			type: Number,
			default: 0,
		},

		response_time: {
			type: Number,
			default: 0,
		},

		created_at: Number,
	},

	{
		timestamps: {
			// Make mongoose use ms
			currentTime: () => Date.now(),

			// Change default variable names
			createdAt: "created_at",
			updatedAt: false,
		},

		// Disable version key (__v)
		versionKey: false,
	},
);

CheckReportSchema.index({ check_id: 1 });

const ChecksReportsDocument = mongoose.model(
	"checks_report",
	CheckReportSchema,
);

async function CreateOrUpdate({
	check_id,
	status,
	up_time,
	down_time,
	response_time,
}) {
	try {
		const old_report = await ChecksReportsDocument.findOne(
			{ check_id },
			{},
			{ $sort: { created_at: -1 } },
		)
			.lean()
			.exec();

		const is_outage =
			!old_report || old_report.status === PollingRequestStatus.UP;

		const report = await ChecksReportsDocument.findOneAndUpdate(
			{ check_id },
			{
				status,
				$inc: {
					up_time,
					down_time,
					outage_number: is_outage ? 1 : 0,
					response_time,
				},
			},
			{ new: true, upsert: true },
		)
			.lean()
			.exec();

		return {
			error: null,
			result: {
				report,
				is_swapped: old_report?.status !== report?.status,
			},
		};
	} catch (error) {
		// Return the error As-Is if already Server Error
		if (error instanceof ServerError) return { error, result: null };
		// Else return the error after converting it to Server Error
		else
			return {
				error: ServerError.CreateFromError(
					error,
					ServerError.Handlers.SERVER,
				),
				result: null,
			};
	}
}

async function FindByCheckIdList(check_id_list) {
	try {
		const result = await ChecksReportsDocument.aggregate([
			{ $match: { check_id: { $in: check_id_list } } },

			{
				$lookup: {
					from: "polling_requests",
					localField: "check_id",
					foreignField: "check_id",
					as: "history",
				},
			},
		]);

		return { error: null, result: result };
	} catch (error) {
		return { error: error, result: null };
	}
}

export default Object.freeze({ CreateOrUpdate, FindByCheckIdList });
