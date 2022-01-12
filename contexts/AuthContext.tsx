import { createContext, ReactNode, useEffect, useState } from "react";
import { setCookie, parseCookies, destroyCookie } from 'nookies';
import { api } from "../services/apiClient";
import Router, { useRouter } from 'next/router';


export type User = {
  email: string;
  permissions: string[];
  roles: string[];
}

type SignInCredentials = {
  email: string;
  password: string
}

type AuthContextData = {
  signIn: (credentials: SignInCredentials) => Promise<void>
  isAuthenticated: boolean;
  user: User;
}

type AuthProviderProps = {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

export function signOut() {
  destroyCookie(undefined, 'nextauth.token');
  destroyCookie(undefined, 'nextauth.refreshToken');

  Router.push('/')
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const router = useRouter()
  const isAuthenticated = !!user;

  useEffect(() => {
    const { 'nextauth.token': token } = parseCookies();
 
    if (token) {
      api.get('/me').then(response => {
        const { email, permissions, roles } = response.data;

        setUser({
          email,
          permissions,
          roles
        })
      }).catch(() => {
        signOut()
      })
    }
  }, [])

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const response = await api.post('/sessions', {
        email,
        password
      })
  
      const { token, refreshToken, permissions, roles } = response.data

      // Persistir dados, temos:
      // localStorage -> o ruim é que no Next fica mais dificil usar, pois não temos acesso ao localStorage no lado do servidor
      // sessionStorage -> dura somente até o usuário fechar o navegador, dura a sessão do navegador
      // cookies -> pode ser acessado pelo lado do browser e pelo lado do servidor 👍🏻

      // primeiro parâmetro é o contexto da requisição. Mas ele não vai existir quando o método (no caso, o signIn) está rodando no browser, no client side
      // o segundo é o nome do cookie
      // terceiro é o valor do token
      // quarto são infos adicionais do token
      setCookie(undefined, 'nextauth.token', token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })

      setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })

      setUser({
        email,
        permissions,
        roles
      })

      api.defaults.headers['Authorization'] = `Bearer ${token}`

      router.push('/dashboard')
    } catch (error) {
      console.log(error);
      
    }
    
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, user }}>
      {children}
    </AuthContext.Provider>
  )
} 