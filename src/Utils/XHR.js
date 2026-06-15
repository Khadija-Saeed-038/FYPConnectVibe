import axios from 'axios';

function parseJson(response) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }
  return response.json ? response.json() : response;
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error = new Error(response.statusText);
  error.response = response;
  error.status = response;
  throw error;
}

export default (url, option) =>
  axios(url, option).then(checkStatus).then(parseJson);
