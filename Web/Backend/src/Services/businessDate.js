const BUSINESS_TIME_ZONE = "America/Tegucigalpa";

function getCurrentBusinessDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
}

function formatBusinessDate(date = getCurrentBusinessDate()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentBusinessYearMonth(now = new Date()) {
  const businessDate = getCurrentBusinessDate(now);
  return {
    year: businessDate.getUTCFullYear(),
    month: businessDate.getUTCMonth() + 1,
    value: formatBusinessDate(businessDate).slice(0, 7),
  };
}

function getBusinessMonthRange({ mes, anio } = {}, now = new Date()) {
  const current = getCurrentBusinessYearMonth(now);
  const month = mes === undefined ? current.month : Number(mes);
  const year = anio === undefined ? current.year : Number(anio);

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1970 || year > 9999) {
    return null;
  }

  return {
    fechaInicio: new Date(Date.UTC(year, month - 1, 1)),
    fechaFin: new Date(Date.UTC(year, month, 0)),
    mes: `${year}-${String(month).padStart(2, "0")}`,
  };
}

function getCurrentBusinessTime(now = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

module.exports = {
  BUSINESS_TIME_ZONE,
  formatBusinessDate,
  getBusinessMonthRange,
  getCurrentBusinessDate,
  getCurrentBusinessTime,
  getCurrentBusinessYearMonth,
};
