import { Row } from "./data";

export type Filter = {
  id: string;
  predicate: (row: Row) => boolean;
};
