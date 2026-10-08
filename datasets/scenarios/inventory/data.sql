INSERT INTO warehouses VALUES
(1, 'Midwest Logistics Hub', 'Chicago', 50000),
(2, 'Pacific Coast Facility', 'Seattle', 35000),
(3, 'Atlantic Distribution Depot', 'Newark', 45000);

INSERT INTO suppliers VALUES
(1, 'Apex Electronics Component Co', 'apex@suppliers.com', 'Taiwan'),
(2, 'Nordic Timber & Materials', 'nordic@timber.se', 'Sweden'),
(3, 'Global Packaging Solutions', 'info@globalpkg.com', 'USA');

INSERT INTO stock_items VALUES
(1, 1, 1, 'SKU-MICRO-01', 'ARM Cortex Processor IC', 450, 100, 18.50),
(2, 1, 1, 'SKU-CAP-100', 'Electrolytic Capacitor 100uF', 3200, 500, 0.45),
(3, 2, 2, 'SKU-PLANK-OAK', 'Solid Oak Finished Planks 2m', 15, 25, 42.00), -- Below reorder level
(4, 2, 3, 'SKU-BOX-M', 'Standard Corrugated Box Medium', 1800, 300, 1.20),
(5, 3, 1, 'SKU-OLED-6IN', '6-inch OLED Display Panel', 8, 50, 65.00); -- Critical stock level

INSERT INTO stock_transactions VALUES
(1, 1, 'inbound', 500, '2023-01-15 08:30:00'),
(2, 1, 'outbound', 50, '2023-01-20 14:00:00'),
(3, 2, 'inbound', 4000, '2023-02-01 10:00:00'),
(4, 2, 'outbound', 800, '2023-02-15 16:30:00'),
(5, 3, 'inbound', 50, '2023-03-01 09:00:00'),
(6, 3, 'outbound', 35, '2023-03-20 11:45:00');
