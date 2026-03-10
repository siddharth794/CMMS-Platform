const XLSX = require("xlsx");
const fs = require("fs");

const assets = [
	{
		Name: "Precision Lathe X-100",
		"Asset Tag": "AST-MACH-010",
		Type: "movable",
		Category: "Machinery",
		Location: "Workshop Floor 1",
		Manufacturer: "Mazak",
		Model: "Quick Turn 100",
		"Serial Number": "MZ-100293",
		"Purchase Date": "2024-01-15",
		"Purchase Cost": "125000",
		"Warranty Expiry": "2027-01-15",
		Status: "active",
		Description: "High-precision lathe for metalworking",
	},
	{
		Name: "Server Rack Alpha",
		"Asset Tag": "AST-IT-020",
		Type: "immovable",
		Category: "IT Infrastructure",
		Location: "Data Center Room 4",
		Manufacturer: "Dell",
		Model: "PowerEdge R750",
		"Serial Number": "DL-SERV-7501",
		"Purchase Date": "2023-11-10",
		"Purchase Cost": "12000",
		"Warranty Expiry": "2026-11-10",
		Status: "active",
		Description: "Primary database server rack",
	},
	{
		Name: "Electric Forklift",
		"Asset Tag": "AST-LOG-030",
		Type: "movable",
		Category: "Logistics",
		Location: "Warehouse Loading Dock",
		Manufacturer: "Toyota",
		Model: "8FBMT25",
		"Serial Number": "TY-FL-9912",
		"Purchase Date": "2023-05-20",
		"Purchase Cost": "45000",
		"Warranty Expiry": "2026-05-20",
		Status: "active",
		Description: "Electric counterbalanced forklift",
	},
	{
		Name: "Backup Generator 500kW",
		"Asset Tag": "AST-UTIL-040",
		Type: "immovable",
		Category: "Utilities",
		Location: "Exterior - North Side",
		Manufacturer: "Cummins",
		Model: "C500D5P",
		"Serial Number": "CM-GEN-500K",
		"Purchase Date": "2022-08-05",
		"Purchase Cost": "75000",
		"Warranty Expiry": "2027-08-05",
		Status: "active",
		Description: "Emergency backup power system",
	},
	{
		Name: "Industrial 3D Printer",
		"Asset Tag": "AST-RND-050",
		Type: "movable",
		Category: "Research & Development",
		Location: "Lab Room 2",
		Manufacturer: "Stratasys",
		Model: "F370",
		"Serial Number": "SS-3DP-7482",
		"Purchase Date": "2024-02-12",
		"Purchase Cost": "55000",
		"Warranty Expiry": "2026-02-12",
		Status: "active",
		Description: "FDM 3D printer for prototyping",
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
