import { _config } from '@ecomplus/utils'
import { API_STORE, API_STORE_CACHE } from './../lib/constants'
import axios from './../lib/axios'

// save Store Cache API status
let isCacheOnline = true

const requestStoreApi = (
  url,
  method = 'get',
  data,
  storeId = _config.get('store_id'),
  authenticationId = _config.get('authentication_id'),
  accessToken = _config.get('access_token'),
  axiosConfig
) => {
  let timeout, baseURL
  const headers = {
    'X-Store-ID': storeId
  }

  // first check if it's a public request
  if (method.toLowerCase() === 'get' && !authenticationId) {
    // less timeout for public requests
    if (isCacheOnline && !/\?/.test(url) && (!axiosConfig || !axiosConfig.params)) {
      // use cache API host
      timeout = 2500
      baseURL = API_STORE_CACHE.replace(':id', storeId)
    } else {
      timeout = 5000
      baseURL = API_STORE
    }
  } else {
    baseURL = API_STORE
    // setup authentication headers
    headers['X-My-ID'] = authenticationId
    headers['X-Access-Token'] = accessToken
  }

  // returns axios request promise
  return axios.request({
    url,
    baseURL,
    method,
    data,
    headers,
    timeout,
    ...axiosConfig
  })

    .catch(err => {
      if (baseURL === API_STORE_CACHE) {
        // retry with live Store API
        let { status } = err.response
        if (!status || status >= 500) {
          isCacheOnline = false
          setTimeout(() => { isCacheOnline = true }, 30000)
          // resend request with same params
          return requestStoreApi(
            url,
            method,
            data,
            storeId,
            authenticationId,
            accessToken,
            axiosConfig
          )
        }
      }
      // chain promise catch
      throw err
    })
}

/**
 * @method
 * @memberof ecomClient
 * @name requestStoreApi
 * @description Send HTTP request to E-Com Plus Store REST API.
 * @param {string} url - API endpoint to request or full absolute URI
 * @param {string} [method='get'] - Request method (HTTP verb)
 * @param {object} [data] - Request body object
 * @param {number} [storeId=_config.get('store_id')] - E-Com Plus Store ID number
 * @param {string} [authenticationId=_config.get('authentication_id')] - My ID for authenticated request
 * @param {string} [accessToken=_config.get('access_token')] - Access token for authenticated request
 * @param {object} [axiosConfig] - Additional settings with custom axios config object
 * @returns {promise}
 */

export default requestStoreApi
