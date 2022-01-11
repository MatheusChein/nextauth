import { useContext, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { setupAPIClient } from "../services/api";
import { api } from "../services/apiClient";
import { withSSRAuth } from "../utils/withSSRAuth";

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

export const getServerSideProps = withSSRAuth(async (context) => {
  const apiClient = setupAPIClient(context);

  const response = await apiClient.get('/me');

  console.log(response.data);
  

  return {
    props: {}
  }
})