/**
 *
 * @param {String} requsted
 * @param {String} excluded
 */
function PathHandler(requsted, excluded) {
	const excluded_array = excluded.split("/");
	const requested_array = requsted.split("/");

	// Ignore any query
	requested_array[requested_array.length - 1] =
		requested_array[requested_array.length - 1].split("?")[0];

	if (excluded_array.length !== requested_array.length) return false;

	const length = requested_array.length;
	for (let index = 0; index < length; index++) {
		// If it's a VARAIBLE skip
		if (excluded_array[index][0] === ":") continue;
		// If it's a MISMATCH Fail
		else if (excluded_array[index] !== requested_array[index]) return false;
	}

	return true;
}

/**
 *
 * @param {Function} middleware
 * @param  {Object[]} excludes
 * @returns
 */
function ExcludePathsMiddleware(middleware, ...excludes) {
	return (request, response, next) => {
		// Check if the requested path with the method is excluded
		const isExcluded = excludes.some(({ methods, path }) => {
			const isMethodExcluded = methods.some(
				(method) => method === request.method,
			);

			const isPathExcluded = PathHandler(request.originalUrl, path);

			// Both method and path must be excluded to skip authentication middleware
			return isPathExcluded && isMethodExcluded;
		});

		// if true => go to next
		// if false => go to the authentication middleware first
		isExcluded ? next() : middleware(request, response, next);
	};
}

export default ExcludePathsMiddleware;
