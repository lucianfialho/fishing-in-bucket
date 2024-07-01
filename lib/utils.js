function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncateResponse(response, maxLength) {
  return response.length > maxLength
    ? response.substring(0, maxLength) + "..."
    : response;
}

module.exports = {
  delay,
  truncateResponse,
};
