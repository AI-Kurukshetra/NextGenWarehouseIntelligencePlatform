import type { ManagedTable } from "@/modules/core/tables";

export type ResourceConfig = {
  resource: string;
  table: ManagedTable;
  searchColumn?: string;
};

export const resourceConfigs = {
  users: {
    resource: "users",
    table: "users",
    searchColumn: "name",
  },
  warehouses: {
    resource: "warehouses",
    table: "warehouses",
    searchColumn: "name",
  },
  inventory: {
    resource: "inventory",
    table: "inventory",
  },
  orders: {
    resource: "orders",
    table: "orders",
  },
  shipments: {
    resource: "shipments",
    table: "shipments",
    searchColumn: "tracking_number",
  },
  receiving: {
    resource: "receiving",
    table: "receipts",
  },
  picking: {
    resource: "picking",
    table: "pickings",
  },
  tasks: {
    resource: "tasks",
    table: "tasks",
    searchColumn: "type",
  },
  workers: {
    resource: "workers",
    table: "workers",
    searchColumn: "name",
  },
  configurations: {
    resource: "configurations",
    table: "configurations",
    searchColumn: "key",
  },
  exceptions: {
    resource: "exceptions",
    table: "exceptions",
  },
} satisfies Record<string, ResourceConfig>;
