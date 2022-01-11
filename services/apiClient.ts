import { setupAPIClient } from "./api";

// essa instância serve somente para o client side, sem passar nenhum contexto para o setupAPIClient
export const api = setupAPIClient()