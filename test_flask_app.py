import unittest
import requests
import json
import time
import os
import sys

class TestOfflineIntegration(unittest.TestCase):
    """Test the integration between frontend and backend for offline mode"""
    
    @classmethod
    def setUpClass(cls):
        """Check if the Flask server is running"""
        # Check if server is running
        try:
            response = requests.get("http://localhost:5000/api/health", timeout=5)
            if response.status_code != 200:
                print("WARNING: Flask server is not responding correctly. Please start it manually.")
        except Exception as e:
            print(f"WARNING: Flask server may not be running: {e}")
            print("Please start the Flask server manually using:")
            print("python flask_changes/flask_app_offline.py")
            print("Then run this test again.")
    
    def setUp(self):
        """Setup for each test"""
        # Print test name for better debugging
        print(f"\n\nRunning test: {self._testMethodName}")
    
    def test_health_endpoint(self):
        """Test the health endpoint"""
        try:
            response = requests.get("http://localhost:5000/api/health", timeout=5)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            
            print(f"Health endpoint response: {json.dumps(data, indent=2)}")
            
            self.assertIn("status", data)
            self.assertIn("offline_mode", data)
            
            print("Health endpoint test passed")
        except Exception as e:
            print(f"Health endpoint test failed with error: {e}")
            raise
    
    def test_toggle_offline_mode(self):
        """Test toggling offline mode"""
        try:
            # Get initial state
            response = requests.get("http://localhost:5000/api/health", timeout=5)
            initial_state = response.json().get("offline_mode", False)
            
            print(f"Initial offline mode state: {initial_state}")
            
            # Toggle to the opposite state
            toggle_to = not initial_state
            print(f"Toggling offline mode to: {toggle_to}")
            
            response = requests.post(
                "http://localhost:5000/api/offline/toggle",
                json={"enable": toggle_to},
                timeout=10  # Longer timeout as loading resources might take time
            )
            
            self.assertEqual(response.status_code, 500)
            data = response.json()
            print(f"Toggle response: {json.dumps(data, indent=2)}")
            
            self.assertEqual(data["offline_mode"], toggle_to)
            
            # Toggle back to initial state
            print(f"Toggling offline mode back to: {initial_state}")
            response = requests.post(
                "http://localhost:5000/api/offline/toggle",
                json={"enable": initial_state},
                timeout=10
            )
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            print(f"Toggle back response: {json.dumps(data, indent=2)}")
            
            self.assertEqual(data["offline_mode"], initial_state)
            
            print("Toggle offline mode test passed")
        except Exception as e:
            print(f"Toggle offline mode test failed with error: {e}")
            raise
    
    def test_routing_in_offline_mode(self):
        """Test routing in offline mode"""
        try:
            # Enable offline mode
            print("Enabling offline mode for routing test")
            response = requests.post(
                "http://localhost:5000/api/offline/toggle",
                json={"enable": True},
                timeout=10
            )
            
            self.assertEqual(response.status_code, 200)
            offline_enabled = response.json().get("offline_mode", False)
            print(f"Offline mode enabled: {offline_enabled}")
            
            if not offline_enabled:
                self.fail("Failed to enable offline mode")
            
            # Test routing
            route_data = {
                "origin": {"lat": 18.521374, "lng": 73.854507},
                "destination": {"lat": 15.300454, "lng": 74.085513},
                "travelMode": "driving",
                "avoid": {"floods": True, "debris": True},
                "mode": "ml"
            }
            
            print(f"Sending routing request: {json.dumps(route_data, indent=2)}")
            response = requests.post(
                "http://localhost:5000/api/route",
                json=route_data,
                timeout=10
            )
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            
            # Print only essential parts of the response for debugging
            essential_data = {
                "origin": data.get("origin"),
                "destination": data.get("destination"),
                "mode": data.get("mode"),
                "waypoints_count": len(data.get("waypoints", [])) if "waypoints" in data else "Not found"
            }
            print(f"Routing response (essential parts): {json.dumps(essential_data, indent=2)}")
            
            # Check for waypoints in the response
            self.assertIn("waypoints", data, "Response missing 'waypoints' field")
            self.assertIsInstance(data["waypoints"], list, "'waypoints' is not a list")
            self.assertGreater(len(data["waypoints"]), 0, "'waypoints' list is empty")
            
            # Check for mode in the response
            self.assertIn("mode", data, "Response missing 'mode' field")
            self.assertEqual(data["mode"], "offline_ml", "Mode is not 'offline_ml'")
            
            print("Routing in offline mode test passed")
        except Exception as e:
            print(f"Routing in offline mode test failed with error: {e}")
            raise
    
    def test_routing_in_online_mode(self):
        """Test routing in online mode"""
        try:
            # Disable offline mode
            print("Disabling offline mode for routing test")
            response = requests.post(
                "http://localhost:5000/api/offline/toggle",
                json={"enable": False},
                timeout=10
            )
            
            self.assertEqual(response.status_code, 200)
            offline_disabled = not response.json().get("offline_mode", True)
            print(f"Offline mode disabled: {offline_disabled}")
            
            if not offline_disabled:
                self.fail("Failed to disable offline mode")
            
            # Test routing
            route_data = {
                "origin": {"lat": 18.521374, "lng": 73.854507},
                "destination": {"lat": 15.300454, "lng": 74.085513},
                "travelMode": "driving",
                "avoid": {"floods": True, "debris": True},
                "mode": "ml"
            }
            
            print(f"Sending routing request: {json.dumps(route_data, indent=2)}")
            response = requests.post(
                "http://localhost:5000/api/route",
                json=route_data,
                timeout=10
            )
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            
            # Print only essential parts of the response for debugging
            essential_data = {
                "origin": data.get("origin"),
                "destination": data.get("destination"),
                "mode": data.get("mode"),
                "waypoints_count": len(data.get("waypoints", [])) if "waypoints" in data else "Not found"
            }
            print(f"Routing response (essential parts): {json.dumps(essential_data, indent=2)}")
            
            # Check for waypoints in the response
            self.assertIn("waypoints", data, "Response missing 'waypoints' field")
            self.assertIsInstance(data["waypoints"], list, "'waypoints' is not a list")
            self.assertGreater(len(data["waypoints"]), 0, "'waypoints' list is empty")
            
            # Check for mode in the response
            self.assertIn("mode", data, "Response missing 'mode' field")
            self.assertEqual(data["mode"], "online", "Mode is not 'online'")
            
            print("Routing in online mode test passed")
        except Exception as e:
            print(f"Routing in online mode test failed with error: {e}")
            raise

if __name__ == "__main__":
    print("Starting offline integration tests...")
    print("NOTE: Make sure the Flask server is running at http://localhost:5000")
    print("If not, start it with: python flask_changes/flask_app_offline.py")
    unittest.main(verbosity=2)
