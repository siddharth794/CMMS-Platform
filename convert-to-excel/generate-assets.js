const XLSX = require("xlsx");
const fs = require("fs");

const assets = [
	{
		Name: "Central Air Conditioning Unit",
		"Asset Tag": "AST-HVAC-001",
		Type: "immovable",
		Category: "HVAC",
		Location: "Building A - Roof",
		Manufacturer: "Daikin",
		Model: "VRV IV",
		"Serial Number": "DK-99231",
		"Purchase Date": "2023-06-12",
		"Purchase Cost": "8500",
		"Warranty Expiry": "2028-06-12",
		Status: "active",
		Description: "Primary AC unit for Building A",
	},
	{
		Name: "Water Pump System",
		"Asset Tag": "AST-PLUMB-002",
		Type: "movable",
		Category: "Plumbing",
		Location: "Basement Pump Room",
		Manufacturer: "Grundfos",
		Model: "CRN10",
		"Serial Number": "GR-11203",
		"Purchase Date": "2022-03-08",
		"Purchase Cost": "3200",
		"Warranty Expiry": "2025-03-08",
		Status: "active",
		Description: "Main water supply pump",
	},
	{
		Name: "Main Power Distribution Panel",
		"Asset Tag": "AST-ELEC-003",
		Type: "immovable",
		Category: "Electrical",
		Location: "Electrical Room - Floor 1",
		Manufacturer: "Schneider Electric",
		Model: "Square D",
		"Serial Number": "SE-55410",
		"Purchase Date": "2021-11-20",
		"Purchase Cost": "6400",
		"Warranty Expiry": "2031-11-20",
		Status: "active",
		Description: "Primary electrical panel for Floor 1",
	},
	{
		Name: "CNC Milling Machine",
		"Asset Tag": "AST-MACH-004",
		Type: "movable",
		Category: "Machinery",
		Location: "Production Floor",
		Manufacturer: "Haas",
		Model: "VF-2",
		"Serial Number": "H-123445",
		"Purchase Date": "2020-09-14",
		"Purchase Cost": "45000",
		"Warranty Expiry": "2025-09-14",
		Status: "maintenance",
		Description: "Precision milling machine",
	},
	{
		Name: "Company Delivery Van",
		"Asset Tag": "AST-VEH-005",
		Type: "movable",
		Category: "Vehicles",
		Location: "Parking Lot B",
		Manufacturer: "Ford",
		Model: "Transit 2022",
		"Serial Number": "VIN-192837465",
		"Purchase Date": "2022-01-18",
		"Purchase Cost": "38000",
		"Warranty Expiry": "2027-01-18",
		Status: "active",
		Description: "Fleet delivery vehicle",
	},
];

// convert JSON → worksheet
const worksheet = XLSX.utils.json_to_sheet(assets);

// create workbook
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");

// write file
XLSX.writeFile(workbook, "assets_demo.xlsx");

console.log("Excel file generated: assets_demo.xlsx");
