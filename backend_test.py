import requests
import sys
import json
from datetime import datetime, timedelta

class MSLKVTCTester:
    def __init__(self, base_url="https://gold-ride.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.driver_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=data)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (expected {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": "admin@mslk-vtc.fr",
                "password": "Admin123!"
            }
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            return True
        return False

    def test_driver_registration(self):
        """Test driver registration"""
        driver_data = {
            "email": f"test_driver_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "phone": "+33612345678",
            "name": "Test Driver",
            "role": "driver"
        }
        
        success, response = self.run_test(
            "Driver Registration",
            "POST",
            "auth/register",
            200,
            data=driver_data
        )
        
        if success and 'token' in response:
            self.driver_token = response['token']
            self.driver_id = response['user']['id']
            return True
        return False

    def test_address_search(self):
        """Test OpenStreetMap address search"""
        success, response = self.run_test(
            "Address Search (OpenStreetMap)",
            "GET",
            "geocode/search",
            200,
            data={"q": "Clermont-Ferrand"}
        )
        
        if success and len(response) > 0:
            # Check if results have required fields
            first_result = response[0]
            has_required_fields = all(key in first_result for key in ['display_name', 'lat', 'lon'])
            self.log_test("Address Search - Required Fields", has_required_fields)
            return has_required_fields
        return False

    def test_price_calculation(self):
        """Test price calculation API"""
        # Clermont-Ferrand to Lyon (approx 160km)
        success, response = self.run_test(
            "Price Calculation",
            "GET",
            "trips/calculate-price",
            200,
            data={
                "pickup_lat": 45.7772,
                "pickup_lng": 3.0870,
                "dropoff_lat": 45.7640,
                "dropoff_lng": 4.8357
            }
        )
        
        if success:
            # Check price formula: 2€/km + 5€ base
            expected_base = 5.0
            expected_per_km = 2.0
            
            price_correct = (
                response.get('base_price') == expected_base and
                response.get('price_per_km') == expected_per_km and
                'distance_km' in response and
                'price' in response
            )
            
            self.log_test("Price Formula Validation", price_correct, 
                         f"Base: {response.get('base_price')}€, Per km: {response.get('price_per_km')}€")
            return price_correct
        return False

    def test_trip_creation(self):
        """Test trip creation (public endpoint)"""
        pickup_datetime = (datetime.now() + timedelta(hours=2)).isoformat()
        
        trip_data = {
            "client_name": "Test Client",
            "client_phone": "+33612345678",
            "client_email": "test@client.com",
            "pickup_address": "Place de Jaude, Clermont-Ferrand",
            "pickup_lat": 45.7772,
            "pickup_lng": 3.0870,
            "dropoff_address": "Gare SNCF, Clermont-Ferrand",
            "dropoff_lat": 45.7640,
            "dropoff_lng": 4.8357,
            "pickup_datetime": pickup_datetime,
            "vehicle_type": "berline",
            "luggage_count": 1,
            "passengers": 2,
            "notes": "Test booking"
        }
        
        success, response = self.run_test(
            "Trip Creation",
            "POST",
            "trips",
            200,
            data=trip_data
        )
        
        if success:
            self.test_trip_id = response.get('id')
            # Verify calculated price and distance
            has_price = response.get('price', 0) > 0
            has_distance = response.get('distance_km', 0) > 0
            self.log_test("Trip - Price & Distance Calculated", has_price and has_distance)
            return True
        return False

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        if not self.admin_token:
            self.log_test("Admin Endpoints", False, "No admin token")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Get all trips
        success1, _ = self.run_test(
            "Admin - Get All Trips",
            "GET",
            "admin/trips",
            200,
            headers=headers
        )
        
        # Get all drivers
        success2, _ = self.run_test(
            "Admin - Get All Drivers",
            "GET",
            "admin/drivers",
            200,
            headers=headers
        )
        
        # Get admin stats
        success3, response = self.run_test(
            "Admin - Get Stats",
            "GET",
            "admin/stats",
            200,
            headers=headers
        )
        
        if success3:
            required_stats = ['total_trips', 'completed_trips', 'pending_trips', 'total_revenue', 'total_commission']
            has_all_stats = all(key in response for key in required_stats)
            self.log_test("Admin Stats - Required Fields", has_all_stats)
        
        return success1 and success2 and success3

    def test_trip_assignment(self):
        """Test admin trip assignment to driver"""
        if not self.admin_token or not hasattr(self, 'driver_id') or not hasattr(self, 'test_trip_id'):
            self.log_test("Trip Assignment", False, "Missing admin token, driver ID, or trip ID")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        success, response = self.run_test(
            "Admin - Assign Trip to Driver",
            "POST",
            f"admin/trips/{self.test_trip_id}/assign",
            200,
            data={
                "driver_id": self.driver_id,
                "commission_rate": 0.15
            },
            headers=headers
        )
        
        if success:
            # Verify trip status changed to assigned
            status_correct = response.get('status') == 'assigned'
            driver_assigned = response.get('driver_id') == self.driver_id
            self.log_test("Trip Assignment - Status & Driver", status_correct and driver_assigned)
            return True
        return False

    def test_driver_endpoints(self):
        """Test driver endpoints"""
        if not self.driver_token:
            self.log_test("Driver Endpoints", False, "No driver token")
            return False
        
        headers = {"Authorization": f"Bearer {self.driver_token}"}
        
        # Get driver trips
        success1, _ = self.run_test(
            "Driver - Get Available Trips",
            "GET",
            "driver/trips",
            200,
            headers=headers
        )
        
        # Update driver status
        success2, _ = self.run_test(
            "Driver - Update Status",
            "PUT",
            "driver/status",
            200,
            data={"status": "available"},
            headers=headers
        )
        
        # Get driver stats
        success3, response = self.run_test(
            "Driver - Get Stats",
            "GET",
            "driver/stats",
            200,
            headers=headers
        )
        
        if success3:
            required_stats = ['daily_revenue', 'weekly_revenue', 'monthly_revenue', 'total_trips', 'completed_trips']
            has_all_stats = all(key in response for key in required_stats)
            self.log_test("Driver Stats - Required Fields", has_all_stats)
        
        return success1 and success2 and success3

    def test_trip_workflow(self):
        """Test complete trip workflow: accept -> start -> complete"""
        if not self.driver_token or not hasattr(self, 'test_trip_id'):
            self.log_test("Trip Workflow", False, "Missing driver token or trip ID")
            return False
        
        headers = {"Authorization": f"Bearer {self.driver_token}"}
        
        # Accept trip
        success1, _ = self.run_test(
            "Driver - Accept Trip",
            "POST",
            f"driver/trips/{self.test_trip_id}/accept",
            200,
            headers=headers
        )
        
        # Start trip
        success2, _ = self.run_test(
            "Driver - Start Trip",
            "POST",
            f"driver/trips/{self.test_trip_id}/status",
            200,
            data={"status": "in_progress"},
            headers=headers
        )
        
        # Complete trip
        success3, response = self.run_test(
            "Driver - Complete Trip",
            "POST",
            f"driver/trips/{self.test_trip_id}/status",
            200,
            data={"status": "completed"},
            headers=headers
        )
        
        if success3:
            # Verify commission was calculated
            commission_calculated = response.get('commission_amount', 0) > 0
            self.log_test("Trip Completion - Commission Calculated", commission_calculated)
        
        return success1 and success2 and success3

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting MSLK VTC API Tests...")
        print(f"Testing against: {self.base_url}")
        print("-" * 50)
        
        # Basic tests
        if not self.test_health_check():
            print("❌ API not accessible, stopping tests")
            return False
        
        # Authentication tests
        if not self.test_admin_login():
            print("❌ Admin login failed, stopping tests")
            return False
        
        if not self.test_driver_registration():
            print("❌ Driver registration failed, stopping tests")
            return False
        
        # Core functionality tests
        self.test_address_search()
        self.test_price_calculation()
        
        if self.test_trip_creation():
            # Admin tests
            self.test_admin_endpoints()
            self.test_trip_assignment()
            
            # Driver tests
            self.test_driver_endpoints()
            self.test_trip_workflow()
        
        # Print summary
        print("-" * 50)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = MSLKVTCTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            "results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())