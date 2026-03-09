-- Example MySQL Script to insert 50 assets
-- Note: UUID() generates a generic UUID, you might need to adjust based on your MySQL version.

SET @ORG_ID = '81808758-8f23-426d-ba0e-581f44a257ab';

INSERT INTO `assets` (`id`, `org_id`, `name`, `asset_tag`, `asset_type`, `category`, `location`, `manufacturer`, `model`, `status`, `created_at`, `updated_at`, `is_active`)
VALUES
(UUID(), @ORG_ID, 'Demo Asset 1', CONCAT('ASSET-', UNIX_TIMESTAMP(), '-001'), 'immovable', 'HVAC', 'Roof', 'Generic Manufacturer', 'Model-X1', 'active', NOW(), NOW(), 1),
(UUID(), @ORG_ID, 'Demo Asset 2', CONCAT('ASSET-', UNIX_TIMESTAMP(), '-002'), 'movable', 'Vehicles', 'Warehouse 1', 'Generic Manufacturer', 'Model-X2', 'active', NOW(), NOW(), 1),
(UUID(), @ORG_ID, 'Demo Asset 3', CONCAT('ASSET-', UNIX_TIMESTAMP(), '-003'), 'immovable', 'IT Equipment', 'Server Room', 'Generic Manufacturer', 'Model-X3', 'active', NOW(), NOW(), 1),
(UUID(), @ORG_ID, 'Demo Asset 4', CONCAT('ASSET-', UNIX_TIMESTAMP(), '-004'), 'movable', 'Plumbing', 'Basement', 'Generic Manufacturer', 'Model-X4', 'active', NOW(), NOW(), 1),
(UUID(), @ORG_ID, 'Demo Asset 5', CONCAT('ASSET-', UNIX_TIMESTAMP(), '-005'), 'immovable', 'Electrical', 'Main Floor', 'Generic Manufacturer', 'Model-X5', 'active', NOW(), NOW(), 1);

-- (This shows the pattern, you would repeat the VALUES row 45 more times for a pure MySQL script)
