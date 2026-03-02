import requests
import sys
from datetime import datetime, timezone, timedelta
import json

class FacilityManagementAPITester:
    def __init__(self, base_url="https://extract-and-create-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.current_user = None
        self.test_results = []

    def log_result(self, test_name, success, message=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            message = f"Status: {response.status_code}"
            if not success:
                message += f" (expected {expected_status})"
                try:
                    error_detail = response.json().get('detail', 'Unknown error')
                    message += f" - {error_detail}"
                except:
                    message += f" - {response.text[:100]}"

            self.log_result(name, success, message)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_result(name, False, f"Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test("Health Check", "GET", "health", 200)
        return success

    def test_seed_demo_data(self):
        """Seed demo data if not exists"""
        success, response = self.run_test("Seed Demo Data", "POST", "seed-demo-data", 200)
        # If demo data already exists (status 400), that's also acceptable
        if not success:
            success, _ = self.run_test("Demo Data Already Exists", "POST", "seed-demo-data", 400)
            if success:
                self.log_result("Demo Data Status", True, "Demo data already seeded")
        return True  # Always return True as both scenarios are acceptable

    def test_login(self):
        """Test login with demo credentials"""
        login_data = {
            "email": "admin@demo.com",
            "password": "admin123"
        }
        success, response = self.run_test("Login", "POST", "auth/login", 200, data=login_data)
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.current_user = response.get('user')
            self.log_result("Token Set", True, f"Token acquired for user {self.current_user.get('email')}")
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, _ = self.run_test("Get Current User", "GET", "auth/me", 200)
        return success

    def test_work_orders_crud(self):
        """Test work orders CRUD operations"""
        # List work orders
        success, wo_list = self.run_test("List Work Orders", "GET", "work-orders", 200)
        if not success:
            return False

        # Create new work order
        wo_data = {
            "title": "Test Work Order",
            "description": "Test description for automated test",
            "priority": "medium",
            "category": "Testing"
        }
        success, created_wo = self.run_test("Create Work Order", "POST", "work-orders", 201, data=wo_data)
        if not success:
            return False

        wo_id = created_wo.get('id')
        if not wo_id:
            self.log_result("Get Work Order ID", False, "No ID in created work order response")
            return False

        # Get specific work order
        success, _ = self.run_test("Get Work Order", "GET", f"work-orders/{wo_id}", 200)
        if not success:
            return False

        # Update work order status
        status_data = {"status": "in_progress"}
        success, _ = self.run_test("Update Work Order Status", "PATCH", f"work-orders/{wo_id}/status", 200, data=status_data)
        
        return True

    def test_assets_crud(self):
        """Test assets CRUD operations"""
        # List assets
        success, assets_list = self.run_test("List Assets", "GET", "assets", 200)
        if not success:
            return False

        # Create new asset
        asset_data = {
            "name": "Test Asset",
            "asset_type": "movable",
            "category": "Testing Equipment",
            "location": "Test Lab",
            "manufacturer": "Test Manufacturer",
            "model": "TEST-001",
            "status": "active"
        }
        success, created_asset = self.run_test("Create Asset", "POST", "assets", 201, data=asset_data)
        if not success:
            return False

        asset_id = created_asset.get('id')
        if not asset_id:
            self.log_result("Get Asset ID", False, "No ID in created asset response")
            return False

        # Get specific asset
        success, _ = self.run_test("Get Asset", "GET", f"assets/{asset_id}", 200)
        if not success:
            return False

        # Update asset
        update_data = {"description": "Updated test asset description"}
        success, _ = self.run_test("Update Asset", "PUT", f"assets/{asset_id}", 200, data=update_data)

        return success

    def test_pm_schedules(self):
        """Test PM schedules operations"""
        # First need to get an asset to associate with PM
        success, assets = self.run_test("Get Assets for PM", "GET", "assets", 200)
        if not success or not assets:
            self.log_result("PM Schedules Test", False, "No assets available for PM testing")
            return False

        asset_id = assets[0]['id']
        
        # List PM schedules
        success, _ = self.run_test("List PM Schedules", "GET", "pm-schedules", 200)
        if not success:
            return False

        # Create PM schedule
        from datetime import timedelta
        next_due = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        pm_data = {
            "name": "Test PM Schedule",
            "description": "Test preventive maintenance",
            "asset_id": asset_id,
            "frequency_type": "days",
            "frequency_value": 30,
            "priority": "medium",
            "next_due": next_due
        }
        success, created_pm = self.run_test("Create PM Schedule", "POST", "pm-schedules", 201, data=pm_data)
        
        return success

    def test_analytics(self):
        """Test analytics dashboard"""
        success, response = self.run_test("Dashboard Analytics", "GET", "analytics/dashboard", 200)
        if success:
            # Validate analytics structure
            required_fields = ['stats', 'wo_by_status', 'wo_by_priority', 'recent_work_orders']
            for field in required_fields:
                if field not in response:
                    self.log_result("Analytics Structure", False, f"Missing field: {field}")
                    return False
            self.log_result("Analytics Structure", True, "All required fields present")
        return success

    def test_user_management(self):
        """Test user management operations"""
        # List users
        success, _ = self.run_test("List Users", "GET", "users", 200)
        if not success:
            return False

        # List roles
        success, _ = self.run_test("List Roles", "GET", "roles", 200)
        
        return success

    def test_audit_logs(self):
        """Test audit logs (admin only)"""
        success, _ = self.run_test("List Audit Logs", "GET", "audit-logs", 200)
        return success

    def test_inventory_crud(self):
        """Test inventory CRUD operations"""
        # Test inventory stats
        success, stats = self.run_test("Get Inventory Stats", "GET", "inventory/stats", 200)
        if not success:
            return False
        
        # Validate stats structure
        required_stats = ['total_items', 'low_stock_count', 'total_value']
        for field in required_stats:
            if field not in stats:
                self.log_result("Inventory Stats Structure", False, f"Missing field: {field}")
                return False
        self.log_result("Inventory Stats Structure", True, "All required stats fields present")
        
        # Test inventory categories
        success, categories = self.run_test("Get Inventory Categories", "GET", "inventory/categories", 200)
        if not success:
            return False
        
        # List inventory items
        success, items_list = self.run_test("List Inventory Items", "GET", "inventory", 200)
        if not success:
            return False
        
        # Test search functionality
        success, _ = self.run_test("Search Inventory", "GET", "inventory?search=filter", 200)
        if not success:
            return False
        
        # Test category filter
        success, _ = self.run_test("Filter by Category", "GET", "inventory?category=Filters", 200)
        if not success:
            return False
        
        # Test low stock filter
        success, low_stock_items = self.run_test("Filter Low Stock", "GET", "inventory?low_stock_only=true", 200)
        if not success:
            return False
        
        # Verify low stock logic (should include Pipe Fittings Kit from demo data)
        low_stock_found = any(item.get('name') == 'Pipe Fittings Kit' for item in low_stock_items)
        if low_stock_found:
            self.log_result("Low Stock Logic", True, "Pipe Fittings Kit correctly identified as low stock")
        else:
            self.log_result("Low Stock Logic", False, "Low stock filter may not be working correctly")
        
        # Create new inventory item
        inventory_data = {
            "name": "Test Inventory Item",
            "description": "Test item for API testing",
            "sku": "TEST-INV-001",
            "category": "Testing",
            "quantity": 10,
            "min_quantity": 5,
            "unit": "pcs",
            "unit_cost": "25.00",
            "storage_location": "Test Storage Room"
        }
        success, created_item = self.run_test("Create Inventory Item", "POST", "inventory", 201, data=inventory_data)
        if not success:
            return False
        
        item_id = created_item.get('id')
        if not item_id:
            self.log_result("Get Inventory Item ID", False, "No ID in created inventory item response")
            return False
        
        # Get specific inventory item
        success, _ = self.run_test("Get Inventory Item", "GET", f"inventory/{item_id}", 200)
        if not success:
            return False
        
        # Update inventory item
        update_data = {
            "description": "Updated test inventory item",
            "quantity": 15
        }
        success, _ = self.run_test("Update Inventory Item", "PUT", f"inventory/{item_id}", 200, data=update_data)
        if not success:
            return False
        
        # Delete inventory item
        success, _ = self.run_test("Delete Inventory Item", "DELETE", f"inventory/{item_id}", 200)
        
        return success

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Facility Management System API Tests")
        print("=" * 60)
        
        # Health check first
        if not self.test_health_check():
            print("❌ Health check failed, stopping tests")
            return False

        # Seed demo data
        self.test_seed_demo_data()

        # Authentication tests
        if not self.test_login():
            print("❌ Login failed, stopping tests")
            return False
        
        if not self.test_get_me():
            print("❌ Get current user failed")
            return False

        # Core functionality tests
        self.test_work_orders_crud()
        self.test_assets_crud()
        self.test_pm_schedules()
        self.test_analytics()
        self.test_user_management()
        self.test_audit_logs()
        self.test_inventory_crud()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            failed_tests = [r for r in self.test_results if not r['success']]
            print(f"❌ {len(failed_tests)} test(s) failed:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['message']}")
            return False

def main():
    tester = FacilityManagementAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())