import Agenda from "agenda";

class JobScheduler {
	#agenda;

	/**
	 *
	 * @param {import("mongoose").Connection} connection
	 */
	constructor(connection) {
		if (JobScheduler.instance) return JobScheduler.instance;

		JobScheduler.instance = this;

		this.#agenda = new Agenda({
			mongo: connection,
			collection: "jobs_schedules",
		});

		return JobScheduler.instance;
	}

	static GetInstance(connection) {
		return new JobScheduler(connection);
	}

	async Start() {
		await this.#agenda.start();
	}

	async Stop() {
		await this.#agenda.stop();
	}

	/**
	 *
	 * @param {String} name
	 * @param {Number} interval
	 * @param {Function} callback
	 * @param  {...any} params
	 */
	async CreateJob(name, interval, callback, ...params) {
		this.#agenda.define(name, (job) => {
			callback(...params);
		});

		await this.#agenda.every(interval, name);
	}

	async UpdateJob(name, interval) {
		const [job] = await this.#agenda.jobs({ name: name });
		job.attrs.repeatInterval = interval;
		await job.save();
	}

	async RemoveJob(name) {
		await this.#agenda.cancel({ name: name });
	}
}

export default JobScheduler;
