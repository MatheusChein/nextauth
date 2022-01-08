import { useContext, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { api } from "../services/api";

export default function Dashboard() {
  const { isAuthenticated, user } = useContext(AuthContext)

  useEffect(() => {
    api.get('/me').then(response => {
      console.log(response);
    }).catch(err => {
      console.log(err);
    })
  }, [])

  return (
    <div>
      {isAuthenticated ? (
        <h1>Hello {user.email}</h1>
      ) : (
        <h1>Goodbye</h1>
      )}
    </div>
  )
}