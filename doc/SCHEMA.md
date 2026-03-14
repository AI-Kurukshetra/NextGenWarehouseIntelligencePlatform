# Database Schema (Supabase PostgreSQL)

users
id
name
email
role

warehouses
id
name
location

clients
id
name
contact

products
id
name
sku
barcode

inventory
id
product_id
location_id
quantity

locations
id
zone_id
code

orders
id
customer_id
status

order_items
id
order_id
product_id
quantity

shipments
id
order_id
carrier_id
tracking_number

receipts
id
vendor_id
status

pickings
id
order_id
worker_id

tasks
id
type
assigned_worker

workers
id
name
role

carriers
id
name

zones
id
warehouse_id

lots
id
product_id

cycle_counts
id
location_id

adjustments
id
inventory_id

returns
id
order_id

kits
id
name

vendors
id
name

customers
id
name

billing
id
client_id

metrics
id
metric_type

audits
id
action

exceptions
id
description

configurations
id
key
value