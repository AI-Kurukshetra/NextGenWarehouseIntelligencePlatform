import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const file = fs.readFileSync(filePath, "utf8");
  for (const line of file.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(".env.local"));
loadEnvFile(path.resolve(".env"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase environment variables required for seeding.");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const qaUser = {
  email: "qa.operator@example.com",
  password: "Warehouse123!",
  name: "QA Operator",
  role: "manager"
};

const ids = {
  warehouse: "11111111-1111-1111-1111-111111111111",
  client: "22222222-2222-2222-2222-222222222222",
  vendor: "33333333-3333-3333-3333-333333333333",
  customerA: "44444444-4444-4444-4444-444444444441",
  customerB: "44444444-4444-4444-4444-444444444442",
  carrierA: "55555555-5555-5555-5555-555555555551",
  carrierB: "55555555-5555-5555-5555-555555555552",
  zoneA: "66666666-6666-6666-6666-666666666661",
  zoneB: "66666666-6666-6666-6666-666666666662",
  locationA: "77777777-7777-7777-7777-777777777771",
  locationB: "77777777-7777-7777-7777-777777777772",
  locationC: "77777777-7777-7777-7777-777777777773",
  locationD: "77777777-7777-7777-7777-777777777774",
  productA: "88888888-8888-8888-8888-888888888881",
  productB: "88888888-8888-8888-8888-888888888882",
  productC: "88888888-8888-8888-8888-888888888883",
  lotA: "99999999-9999-9999-9999-999999999991",
  lotB: "99999999-9999-9999-9999-999999999992",
  inventoryA: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
  inventoryB: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
  inventoryC: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
  inventoryD: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4",
  receiptDraft: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1",
  receiptReceived: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2",
  workerA: "cccccccc-cccc-cccc-cccc-ccccccccccc1",
  workerB: "cccccccc-cccc-cccc-cccc-ccccccccccc2",
  workerC: "cccccccc-cccc-cccc-cccc-ccccccccccc3",
  orderCreated: "dddddddd-dddd-dddd-dddd-ddddddddddd1",
  orderPicked: "dddddddd-dddd-dddd-dddd-ddddddddddd2",
  orderPacked: "dddddddd-dddd-dddd-dddd-ddddddddddd3",
  orderShipped: "dddddddd-dddd-dddd-dddd-ddddddddddd4",
  orderItemA: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1",
  orderItemB: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2",
  orderItemC: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3",
  orderItemD: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4",
  pickingReady: "ffffffff-ffff-ffff-ffff-fffffffffff1",
  pickingDone: "ffffffff-ffff-ffff-ffff-fffffffffff2",
  pickingPacked: "ffffffff-ffff-ffff-ffff-fffffffffff3",
  shipmentPacked: "12121212-1212-1212-1212-121212121211",
  shipmentShipped: "12121212-1212-1212-1212-121212121212",
  adjustmentA: "13131313-1313-1313-1313-131313131311",
  adjustmentB: "13131313-1313-1313-1313-131313131312",
  cycleCountA: "14141414-1414-1414-1414-141414141411",
  cycleCountB: "14141414-1414-1414-1414-141414141412",
  returnA: "15151515-1515-1515-1515-151515151511",
  configA: "16161616-1616-1616-1616-161616161611",
  configB: "16161616-1616-1616-1616-161616161612"
};

async function ensureQaUser() {
  const { data: listed, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = listed.users.find((user) => user.email === qaUser.email);
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password: qaUser.password,
      email_confirm: true,
      user_metadata: {
        name: qaUser.name,
        role: qaUser.role
      }
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: qaUser.email,
    password: qaUser.password,
    email_confirm: true,
    user_metadata: {
      name: qaUser.name,
      role: qaUser.role
    }
  });
  if (error) throw error;
  return data.user;
}

async function upsert(table, rows, onConflict = "id") {
  const { error } = await admin.from(table).upsert(rows, { onConflict });
  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
}

async function main() {
  const qaAuthUser = await ensureQaUser();
  const now = new Date();
  const today = now.toISOString();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  await upsert("warehouses", [{ id: ids.warehouse, name: "Central Distribution Hub", code: "CDH-01", location: "Ahmedabad", timezone: "Asia/Kolkata", is_active: true }]);
  await upsert("clients", [{ id: ids.client, name: "Acme Retail", code: "ACME", contact: "Acme Operations", email: "ops@acmeretail.example", phone: "+91-90000-10000", is_active: true }]);
  await upsert("users", [{ id: qaAuthUser.id, warehouse_id: ids.warehouse, client_id: ids.client, name: qaUser.name, email: qaUser.email, role: qaUser.role, status: "active" }]);
  await upsert("vendors", [{ id: ids.vendor, name: "Prime Industrial Supplies", contact: "Inbound Desk", email: "receiving@prime.example", phone: "+91-90000-20000" }]);
  await upsert("customers", [
    { id: ids.customerA, client_id: ids.client, name: "North Retail Stores", code: "NORTH", email: "north@example.com", phone: "+91-90000-30001" },
    { id: ids.customerB, client_id: ids.client, name: "South Wholesale", code: "SOUTH", email: "south@example.com", phone: "+91-90000-30002" }
  ]);
  await upsert("carriers", [
    { id: ids.carrierA, name: "Dart Logistics", code: "DART", service_level: "Express" },
    { id: ids.carrierB, name: "Blue Freight", code: "BLUE", service_level: "Ground" }
  ]);
  await upsert("products", [
    { id: ids.productA, client_id: ids.client, name: "Industrial Gloves", sku: "GLV-100", barcode: "8900000000011", description: "Warehouse-grade safety gloves", unit_of_measure: "pair", is_active: true },
    { id: ids.productB, client_id: ids.client, name: "Handheld Scanner", sku: "SCN-200", barcode: "8900000000028", description: "2D barcode handheld scanner", unit_of_measure: "each", is_active: true },
    { id: ids.productC, client_id: ids.client, name: "Packing Tape", sku: "TPE-300", barcode: "8900000000035", description: "Heavy-duty packing tape", unit_of_measure: "roll", is_active: true }
  ], "sku");
  await upsert("zones", [
    { id: ids.zoneA, warehouse_id: ids.warehouse, name: "Ambient Storage", code: "A1" },
    { id: ids.zoneB, warehouse_id: ids.warehouse, name: "Packing Lane", code: "P1" }
  ]);
  await upsert("locations", [
    { id: ids.locationA, warehouse_id: ids.warehouse, zone_id: ids.zoneA, code: "A1-01", bin: "BIN-01", capacity: 300, location_type: "storage", is_active: true },
    { id: ids.locationB, warehouse_id: ids.warehouse, zone_id: ids.zoneA, code: "A1-02", bin: "BIN-02", capacity: 240, location_type: "storage", is_active: true },
    { id: ids.locationC, warehouse_id: ids.warehouse, zone_id: ids.zoneB, code: "P1-01", bin: "PACK-01", capacity: 120, location_type: "packing", is_active: true },
    { id: ids.locationD, warehouse_id: ids.warehouse, zone_id: ids.zoneB, code: "P1-02", bin: "PACK-02", capacity: 100, location_type: "staging", is_active: true }
  ]);
  await upsert("lots", [
    { id: ids.lotA, product_id: ids.productA, lot_number: "LOT-GLV-2026-01", serial_number: null, expiration_date: "2027-03-01", manufactured_at: "2026-01-10" },
    { id: ids.lotB, product_id: ids.productB, lot_number: "LOT-SCN-2026-01", serial_number: "SCN-SERIAL-001", expiration_date: null, manufactured_at: "2026-02-04" }
  ]);
  await upsert("inventory", [
    { id: ids.inventoryA, client_id: ids.client, warehouse_id: ids.warehouse, product_id: ids.productA, location_id: ids.locationA, lot_id: ids.lotA, quantity: 180, reserved_quantity: 24, status: "available" },
    { id: ids.inventoryB, client_id: ids.client, warehouse_id: ids.warehouse, product_id: ids.productB, location_id: ids.locationB, lot_id: ids.lotB, quantity: 48, reserved_quantity: 6, status: "available" },
    { id: ids.inventoryC, client_id: ids.client, warehouse_id: ids.warehouse, product_id: ids.productC, location_id: ids.locationC, lot_id: null, quantity: 96, reserved_quantity: 8, status: "available" },
    { id: ids.inventoryD, client_id: ids.client, warehouse_id: ids.warehouse, product_id: ids.productA, location_id: ids.locationD, lot_id: ids.lotA, quantity: 12, reserved_quantity: 0, status: "available" }
  ]);
  await upsert("receipts", [
    { id: ids.receiptDraft, vendor_id: ids.vendor, warehouse_id: ids.warehouse, client_id: ids.client, status: "draft", receipt_number: "RCV-1001", expected_at: tomorrow, received_at: null },
    { id: ids.receiptReceived, vendor_id: ids.vendor, warehouse_id: ids.warehouse, client_id: ids.client, status: "received", receipt_number: "RCV-1002", expected_at: today, received_at: today }
  ], "receipt_number");
  await upsert("workers", [
    { id: ids.workerA, user_id: qaAuthUser.id, warehouse_id: ids.warehouse, name: "QA Operator", role: "picker", status: "active" },
    { id: ids.workerB, user_id: null, warehouse_id: ids.warehouse, name: "Anaya Patel", role: "receiver", status: "active" },
    { id: ids.workerC, user_id: null, warehouse_id: ids.warehouse, name: "Rohan Shah", role: "packer", status: "active" }
  ]);
  await upsert("orders", [
    { id: ids.orderCreated, client_id: ids.client, customer_id: ids.customerA, warehouse_id: ids.warehouse, status: "pick_ready", priority: "high", order_number: "SO-1001", ordered_at: today },
    { id: ids.orderPicked, client_id: ids.client, customer_id: ids.customerB, warehouse_id: ids.warehouse, status: "picked", priority: "normal", order_number: "SO-1002", ordered_at: today },
    { id: ids.orderPacked, client_id: ids.client, customer_id: ids.customerA, warehouse_id: ids.warehouse, status: "packed", priority: "rush", order_number: "SO-1003", ordered_at: today },
    { id: ids.orderShipped, client_id: ids.client, customer_id: ids.customerB, warehouse_id: ids.warehouse, status: "shipped", priority: "normal", order_number: "SO-1004", ordered_at: today }
  ], "order_number");
  await upsert("order_items", [
    { id: ids.orderItemA, order_id: ids.orderCreated, product_id: ids.productA, quantity: 10, picked_quantity: 0 },
    { id: ids.orderItemB, order_id: ids.orderPicked, product_id: ids.productB, quantity: 4, picked_quantity: 4 },
    { id: ids.orderItemC, order_id: ids.orderPacked, product_id: ids.productC, quantity: 12, picked_quantity: 12 },
    { id: ids.orderItemD, order_id: ids.orderShipped, product_id: ids.productA, quantity: 8, picked_quantity: 8 }
  ]);
  await upsert("pickings", [
    { id: ids.pickingReady, order_id: ids.orderCreated, worker_id: ids.workerA, status: "assigned", route_code: "PK-1001", started_at: today, completed_at: null },
    { id: ids.pickingDone, order_id: ids.orderPicked, worker_id: ids.workerA, status: "completed", route_code: "PK-1002", started_at: today, completed_at: today },
    { id: ids.pickingPacked, order_id: ids.orderPacked, worker_id: ids.workerC, status: "completed", route_code: "PK-1003", started_at: today, completed_at: today }
  ]);
  await upsert("shipments", [
    { id: ids.shipmentPacked, order_id: ids.orderPacked, carrier_id: ids.carrierA, tracking_number: "TRK-1003", status: "packed", shipped_at: null },
    { id: ids.shipmentShipped, order_id: ids.orderShipped, carrier_id: ids.carrierB, tracking_number: "TRK-1004", status: "shipped", shipped_at: today }
  ], "tracking_number");
  await upsert("adjustments", [
    { id: ids.adjustmentA, inventory_id: ids.inventoryA, quantity_delta: 12, reason: "cycle-count-variance", created_by: qaAuthUser.id },
    { id: ids.adjustmentB, inventory_id: ids.inventoryC, quantity_delta: -4, reason: "damage-writeoff", created_by: qaAuthUser.id }
  ]);
  await upsert("cycle_counts", [
    { id: ids.cycleCountA, location_id: ids.locationA, status: "scheduled", scheduled_for: tomorrow, counted_at: null, variance: 0 },
    { id: ids.cycleCountB, location_id: ids.locationB, status: "completed", scheduled_for: today, counted_at: today, variance: -1 }
  ]);
  await upsert("returns", [
    { id: ids.returnA, order_id: ids.orderShipped, status: "received", disposition: "restock", received_at: today }
  ]);
  await upsert("configurations", [
    { id: ids.configA, key: "warehouse.default_wave_size", scope: "system", value: { value: 25 }, description: "Default wave size for outbound picks", is_secret: false },
    { id: ids.configB, key: "notifications.shift_handoff", scope: "warehouse", value: { enabled: true, time: "18:00" }, description: "Shift handoff alert configuration", is_secret: false }
  ], "key,scope");

  console.log("Seed complete.");
  console.log(`Login email: ${qaUser.email}`);
  console.log(`Login password: ${qaUser.password}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});