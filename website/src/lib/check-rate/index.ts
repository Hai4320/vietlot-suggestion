// Public entry point — import this from UI components to get evaluators
// registered + public API in one go.

import "./evaluators";

export { parseCsv, groupTickets, ticketsToCsv, CsvFormatError, REQUIRED_COLUMNS } from "./io";
export { loadDraws, supportedGames } from "./loader";
export { getEvaluator, registeredGames } from "./registry";
export { formatVnd, formatPercent, formatRoi, serializeGroupForParity, serializeHistoryForParity } from "./reporter";
export { roi } from "./types";
export type { Ticket, Draw, EvalResult, HistoryMatch, PerDrawHit, GroupKey } from "./types";
export type { Evaluator } from "./registry";
