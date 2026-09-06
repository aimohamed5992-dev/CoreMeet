import axios from "axios";
import { config } from "./config";

/**
 * Shared axios instance. Auth interceptors (attaching the JWT and refreshing
 * it) are added in step 2 together with the auth feature.
 */
export const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

export type ApiError = {
  message: string;
  errors?: Record<string, string[]>;
};
