import axios from 'axios'

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ??
      error.response?.data ??
      error.message ??
      '알 수 없는 오류가 발생했습니다.'
    return Promise.reject(new Error(String(message)))
  },
)

export default client
