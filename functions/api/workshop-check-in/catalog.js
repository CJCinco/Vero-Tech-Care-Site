import { jsonResponse, methodNotAllowed } from "../../_lib/checkin.js";
import { publicWorkshopCatalog } from "../../_lib/workshop-catalog.js";

export function onRequestGet() {
  return jsonResponse({ ok: true, workshops: publicWorkshopCatalog() });
}

export function onRequest() {
  return methodNotAllowed("GET");
}
