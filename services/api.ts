import axios, { AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies';
import { signOut } from '../contexts/AuthContext';

let isRefreshing = false;
let failedRequestQueue = [];

export function setupAPIClient(context = undefined) {
  let cookies = parseCookies(context);

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    }
  })
  
  api.interceptors.response.use(responseOnFulfilled => {
    return responseOnFulfilled
  }, (error: AxiosError) => {
    if (error.response.status === 401) {
      if (error.response.data?.code === 'token.expired') {
        // renovar o token
        cookies = parseCookies(context);
        
        const { 'nextauth.refreshToken': refreshToken } = cookies;
  
        const originalConfig = error.config
  
        if (!isRefreshing) {
          isRefreshing = true;
  
          api.post('/refresh', {
            refreshToken,
          }).then(response => {
            const { token } = response.data;
    
            setCookie(context, 'nextauth.token', token, {
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: '/'
            });
      
            setCookie(context, 'nextauth.refreshToken', response.data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: '/'
            });
    
            api.defaults.headers['Authorization'] = `Bearer ${token}`;
  
            failedRequestQueue.forEach(request => {
              request.onSuccess(token)
            });
  
            failedRequestQueue = [];
  
            //como verificar no Next se estou do lado do client ou do server
            // process.browser = true quer dizer que estou no client side
            // essa verificação é pq o método signOut usa o Router do next, que só funciona no browser
            if (process.browser) {
              signOut()
            }
          }).catch(err => {
            failedRequestQueue.forEach(request => {
              request.onFailure(err)
            });
  
            failedRequestQueue = [];
          }).finally(() => {
            isRefreshing = false;
          })
        }
  
        // Essa promise é pq o axios nao deixa usar async await nos interceptors
        return new Promise((resolve, reject) => {
          failedRequestQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers['Authorization'] = `Bearer ${token}`;
  
              resolve(api(originalConfig))
            },
            onFailure: (err: AxiosError) => {
              reject(err)
            }
          })
        })
      } else {
        if (process.browser) {
          signOut()
        }
      }
    }
  
    return Promise.reject(error)
  })

  return api;
}