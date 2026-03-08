/**
 * api/index.js
 * ------------
 * All backend API calls via Axios.
 * Components never call axios directly — always go through here.
 */

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
});

export const fetchRevenue = () =>
  client.get("/api/revenue").then((r) => r.data);
export const fetchCustomers = () =>
  client.get("/api/top-customers").then((r) => r.data);
export const fetchCategories = () =>
  client.get("/api/categories").then((r) => r.data);
export const fetchRegions = () =>
  client.get("/api/regions").then((r) => r.data);

