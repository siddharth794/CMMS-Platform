/**
 * seed-all.ts — One command to fully seed a fresh database.
 *
 * Usage:  npm run seed:all
 *
 * Idempotent — safe to re-run on an already-seeded database.
 * Uses findOrCreate / upsert wherever possible so it never duplicates rows.
 *
 * Steps:
 *   1. Organization
 *   2. Accesses (Permissions)
 *   3. Roles + Role ↔ Access mapping
 *   4. Demo Users + User ↔ Role mapping
 *   5. Demo Site
 *   6. Demo Assets (50)
 *   7. Demo Inventory Items (50)
 *   8. Demo Work Orders (50)
 */

import bcrypt from 'bcryptjs';
import {
  Organization, Site, Role, Access, User, Asset, InventoryItem, WorkOrder, sequelize
} from '../models';
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../constants/permissions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const log    = (msg: string) => console.log(`  ✓ ${msg}`);
const header = (msg: string) => console.log(`\n━━━ ${msg} ━━━`);

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seedAll() {
  try {
    await sequelize.authenticate();
    console.log('🔌 Database connection established.\n');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║      CMMS Platform — Full Seed           ║');
    console.log('╚══════════════════════════════════════════╝');

    // ── 1. Organization ─────────────────────────────────────────────────────

    header('1 · Organization');
    const [org]: any = await Organization.findOrCreate({
      where: { name: 'CMMS Demo Org' },
      defaults: {
        description: 'Default organization for CMMS Platform',
        address: '123 Tech Lane',
        owner_name: 'John Doe',
        website_url: 'https://demo-corp.com',
      },
    });
    const ORG_ID = org.id;
    log(`Organization "${org.name}" (${ORG_ID})`);

    // ── 2. Accesses (Permissions) ───────────────────────────────────────────

    header('2 · Permissions');
    let permCreated = 0;
    for (const perm of PERMISSIONS) {
      const [, created] = await Access.findOrCreate({
        where: { name: perm.name },
        defaults: { ...perm, is_system: true, org_id: null },
      });
      if (created) permCreated++;
    }
    log(`${PERMISSIONS.length} total permissions (${permCreated} newly created)`);

    // ── 3. Roles + Permission mapping ───────────────────────────────────────

    header('3 · Roles');
    const roleData = [
      { name: 'Super_Admin',      description: 'Full system access' },
      { name: 'Org_Admin',        description: 'Organization administrator' },
      { name: 'Facility_Manager', description: 'Manages facilities and work orders' },
      { name: 'Technician',       description: 'Executes work orders' },
      { name: 'Requestor',        description: 'Creates and tracks work orders' },
      { name: 'Cleaning_Staff',   description: 'Executes area-based checklists' },
    ];

    for (const rd of roleData) {
      const [role] = await Role.findOrCreate({
        where: { name: rd.name, org_id: ORG_ID },
        defaults: { ...rd, org_id: ORG_ID, is_system_role: true },
      });

      // Map permissions
      const allowed = DEFAULT_ROLE_PERMISSIONS[rd.name] || [];
      if (allowed.includes('*')) {
        const all = await Access.findAll({ where: { is_system: true } });
        await (role as any).setAccesses(all);
      } else if (allowed.length > 0) {
        const subset = await Access.findAll({ where: { name: allowed, is_system: true } });
        await (role as any).setAccesses(subset);
      }

      log(`Role "${rd.name}" → ${allowed.includes('*') ? 'ALL' : allowed.length} permissions`);
    }

    // ── 4. Demo Users ───────────────────────────────────────────────────────

    header('4 · Demo Users');
    const demoUsers = [
      { email: 'admin@demo.com',     roleName: 'Super_Admin',      username: 'admin',     firstName: 'Admin',    lastName: 'User',      password: 'admin123' },
      { email: 'orgadmin@demo.com',  roleName: 'Org_Admin',        username: 'orgadmin',  firstName: 'Org',      lastName: 'Admin',     password: 'orgadmin123' },
      { email: 'manager@demo.com',   roleName: 'Facility_Manager', username: 'manager',   firstName: 'Facility', lastName: 'Manager',   password: 'manager123' },
      { email: 'tech@demo.com',      roleName: 'Technician',       username: 'tech',      firstName: 'Tech',     lastName: 'User',      password: 'tech123' },
      { email: 'requestor@demo.com', roleName: 'Requestor',        username: 'requestor', firstName: 'Staff',    lastName: 'Requestor', password: 'requestor123' },
      { email: 'cleaner@demo.com',   roleName: 'Cleaning_Staff',   username: 'cleaner',   firstName: 'Demo',     lastName: 'Cleaner',   password: 'cleaner123' },
    ];

    console.log('  ┌─────────────────────────────────────────────────────────────┐');
    console.log('  │  Email                 Password        Role                 │');
    console.log('  ├─────────────────────────────────────────────────────────────┤');

    for (const u of demoUsers) {
      const role: any = await Role.findOne({ where: { name: u.roleName, is_system_role: true } });
      if (!role) continue;

      const hash = bcrypt.hashSync(u.password, bcrypt.genSaltSync(10));

      const [user, created]: any = await User.findOrCreate({
        where: { email: u.email },
        defaults: {
          org_id: ORG_ID,
          username: u.username,
          first_name: u.firstName,
          last_name: u.lastName,
          password_hash: hash,
          is_active: true,
        },
      });

      if (created) await user.addRole(role);

      const pad = (s: string, n: number) => s.padEnd(n);
      console.log(`  │  ${pad(u.email, 22)} ${pad(u.password, 16)} ${pad(u.roleName, 19)} │`);
    }
    console.log('  └─────────────────────────────────────────────────────────────┘');

    // ── 5. Demo Site ────────────────────────────────────────────────────────

    header('5 · Demo Site');
    const manager: any = await User.findOne({ where: { email: 'manager@demo.com' } });
    const [site]: any = await Site.findOrCreate({
      where: { name: 'Main Campus', org_id: ORG_ID },
      defaults: {
        org_id: ORG_ID,
        address: '123 Tech Lane',
        city: 'Bengaluru',
        state: 'Karnataka',
        zip_code: '560001',
        country: 'India',
        phone: '+91 80 1234 5678',
        description: 'Primary facility campus',
        manager_id: manager?.id || null,
      },
    });
    log(`Site "${site.name}"`);

    // ── 6. Demo Assets (50) ─────────────────────────────────────────────────

    header('6 · Demo Assets');
    const existingAssets = await Asset.count({ where: { org_id: ORG_ID } });
    if (existingAssets >= 50) {
      log(`${existingAssets} assets already exist — skipping`);
    } else {
      const categories = ['HVAC', 'Vehicles', 'IT Equipment', 'Plumbing', 'Electrical'];
      const locations  = ['Roof', 'Warehouse 1', 'Server Room', 'Basement', 'Main Floor'];
      const assetsData = [];
      const ts = Date.now();

      for (let i = 1; i <= 50; i++) {
        assetsData.push({
          org_id: ORG_ID,
          site_id: site.id,
          name: `Demo Asset ${i}`,
          asset_tag: `ASSET-${ts}-${i.toString().padStart(3, '0')}`,
          asset_type: i % 2 === 0 ? 'movable' : 'immovable',
          category: categories[i % categories.length],
          location: locations[i % locations.length],
          manufacturer: 'Generic Manufacturer',
          model: `Model-X${i}`,
          status: 'active',
        });
      }
      const created = await Asset.bulkCreate(assetsData);
      log(`${created.length} assets created`);
    }

    // ── 7. Demo Inventory Items (50) ────────────────────────────────────────

    header('7 · Demo Inventory Items');
    const existingInv = await InventoryItem.count({ where: { org_id: ORG_ID } });
    if (existingInv >= 50) {
      log(`${existingInv} inventory items already exist — skipping`);
    } else {
      const invCategories = ['Mechanical', 'Electrical', 'Cleaning', 'Safety', 'Fasteners'];
      const invData = [];
      const ts = Date.now();

      for (let i = 1; i <= 50; i++) {
        invData.push({
          org_id: ORG_ID,
          site_id: site.id,
          name: `Demo Part ${i}`,
          sku: `SKU-${ts}-${i.toString().padStart(3, '0')}`,
          category: invCategories[i % invCategories.length],
          description: `Description for demo part ${i}`,
          quantity: Math.floor(Math.random() * 100) + 10,
          min_quantity: 5,
          unit: 'pcs',
          unit_cost: (Math.random() * 50 + 5).toFixed(2),
          storage_location: `Warehouse 1 - Bin ${i}`,
        });
      }
      const created = await InventoryItem.bulkCreate(invData);
      log(`${created.length} inventory items created`);
    }

    // ── 8. Demo Work Orders (50) ────────────────────────────────────────────

    header('8 · Demo Work Orders');
    const existingWO = await WorkOrder.count({ where: { org_id: ORG_ID } });
    if (existingWO >= 50) {
      log(`${existingWO} work orders already exist — skipping`);
    } else {
      const users: any = await User.findAll({ where: { org_id: ORG_ID }, limit: 2 });
      const assets: any = await Asset.findAll({ where: { org_id: ORG_ID }, limit: 50 });

      const requesterId = users[0]?.id;
      const assigneeId  = users[1]?.id || users[0]?.id;

      const statuses: ('new' | 'open' | 'in_progress' | 'on_hold' | 'completed')[] =
        ['new', 'open', 'in_progress', 'on_hold', 'completed'];
      const priorities: ('low' | 'medium' | 'high' | 'critical')[] =
        ['low', 'medium', 'high', 'critical'];

      const woData = [];
      const ts = Date.now();

      for (let i = 1; i <= 50; i++) {
        const asset = assets[i % assets.length];
        woData.push({
          org_id: ORG_ID,
          site_id: site.id,
          wo_number: `WO-${ts}-${i.toString().padStart(3, '0')}`,
          title: `Demo Maintenance Task ${i}`,
          description: `Generated demo work order #${i} for ${asset.name}.`,
          asset_id: asset.id,
          requester_id: requesterId,
          assignee_id: assigneeId,
          status: statuses[i % statuses.length],
          priority: priorities[i % priorities.length],
          location: asset.location || 'Main Site',
          estimated_hours: Math.floor(Math.random() * 8) + 1,
        });
      }
      const created = await WorkOrder.bulkCreate(woData);
      log(`${created.length} work orders created`);
    }

    // ── Done ────────────────────────────────────────────────────────────────

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║      ✅  All seeding complete!            ║');
    console.log('╚══════════════════════════════════════════╝\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedAll();
