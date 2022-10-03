import React from "react";
import * as MUI from "@mui/material";

/**
 * type util...
 */
const entries = Object.entries as <T extends Record<string, unknown>>(
  record: T
) => Array<{ [k in keyof T]: [k, T[k]] }[keyof T]>;

export const Table = function Table<Row, Column extends string>({
  columns,
  rows,
}: {
  columns: Record<
    Column,
    {
      header: JSX.Element;
      cell: React.ComponentType<{
        row: Row;
      }>;
      width?: number;
      align?: "left" | "center" | "right";
    }
  >;
  rows: Row[];
}) {
  const columnArray = entries(columns);

  return (
    <MUI.TableContainer style={{ maxHeight: "100%" }}>
      <MUI.Table stickyHeader>
        <MUI.TableHead>
          <MUI.TableRow>
            {columnArray.map(([column, { header, width, align }]) => (
              <MUI.TableCell
                key={column}
                style={{ width, textAlign: align, fontWeight: "bold" }}
              >
                {header}
              </MUI.TableCell>
            ))}
          </MUI.TableRow>
        </MUI.TableHead>
        <MUI.TableBody>
          {rows.map((row, i) => {
            return (
              <MUI.TableRow key={i}>
                {columnArray.map(([column, { cell: Cell, align }]) => {
                  return (
                    <MUI.TableCell key={column} style={{ textAlign: align }}>
                      <Cell row={row} />
                    </MUI.TableCell>
                  );
                })}
              </MUI.TableRow>
            );
          })}
        </MUI.TableBody>
      </MUI.Table>
    </MUI.TableContainer>
  );
};
