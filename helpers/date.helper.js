import moment from "moment";

const DATE_FORMAT = "YYYY/MM/DD";
const DATE_FORMAT_LONG = `${DATE_FORMAT} [at] hh:mm:ss a`;

const MAX_DATE = "9999/01/01";

function DateFormater(date) {
	return moment(date).format(DATE_FORMAT);
}

function DateFormaterLong(date) {
	return moment(date).format(DATE_FORMAT_LONG);
}

function ValidateDate(date) {
	return moment(date, DATE_FORMAT, true).isValid();
}

export default Object.freeze({
	ValidateDate,
	DateFormater,
	DateFormaterLong,
	DATE_FORMAT,
	DATE_FORMAT_LONG,
	MAX_DATE,
});
