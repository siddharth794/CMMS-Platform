const XLSX = require("xlsx");
const fs = require("fs");

const assets = [
	{
		assetName: "Central Air Conditioning Unit",
		category: "HVAC",
		assetType: "Movable",
		model: "Daikin VRV IV",
		location: "Building A - Roof",
		purchaseDate: "2023-06-12",
		value: 8500,
	},
	{
		assetName: "Water Pump System",
		category: "Plumbing",
		assetType: "Movable",
		model: "Grundfos CRN10",
		location: "Basement Pump Room",
		purchaseDate: "2022-03-08",
		value: 3200,
	},
	{
		assetName: "Main Power Distribution Panel",
		category: "Electrical",
		assetType: "Immovable",
		model: "Schneider Electric Panel",
		location: "Electrical Room - Floor 1",
		purchaseDate: "2021-11-20",
		value: 6400,
	},
	{
		assetName: "CNC Milling Machine",
		category: "Machinery",
		assetType: "Movable",
		model: "Haas VF-2",
		location: "Production Floor",
		purchaseDate: "2020-09-14",
		value: 45000,
	},
	{
		assetName: "Company Delivery Van",
		category: "Vehicles",
		assetType: "Movable",
		model: "Ford Transit 2022",
		location: "Parking Lot B",
		purchaseDate: "2022-01-18",
		value: 38000,
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
