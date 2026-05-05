"""
Comprehensive Workflow Tests - Simulates Full User Journeys

These tests simulate what a real user would do in the app:
1. Register, login, logout flows
2. Full inventory management workflow
3. Material request lifecycle (existing and new items)
4. Admin approval workflow
5. Delivery creation and inventory updates
6. Jobsite management
"""

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from .models import InventoryItem, MaterialRequest, Delivery, Jobsite
import json

User = get_user_model()


class FullAuthWorkflowTest(TestCase):
    """Simulate complete authentication user journey."""

    def setUp(self):
        self.client = Client()

    def test_complete_auth_workflow(self):
        """
        User Journey: Register → Logout → Login → Access Protected Resource
        """
        print("\n=== AUTH WORKFLOW TEST ===")

        # Step 1: Register new user
        print("Step 1: Registering new user 'demo_user'...")
        response = self.client.post(
            "/api/register/",
            data=json.dumps({
                "username": "demo_user",
                "password": "SecurePass123",
                "email": "demo@example.com"
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201, f"Registration failed: {response.json()}")
        print(f"   ✓ Registration successful - Status: {response.status_code}")

        # Verify user was created with 'user' role (not admin)
        user = User.objects.get(username="demo_user")
        self.assertEqual(user.role, "user")
        print(f"   ✓ User role correctly set to 'user' (not admin)")

        # Step 2: Logout
        print("Step 2: Logging out...")
        response = self.client.post("/api/logout/")
        self.assertEqual(response.status_code, 200)
        print(f"   ✓ Logout successful")

        # Step 3: Try accessing protected resource (should fail)
        print("Step 3: Attempting to access inventory without auth...")
        response = self.client.get("/api/inventory/")
        self.assertEqual(response.status_code, 401)
        print(f"   ✓ Correctly blocked - Status: 401 Unauthorized")

        # Step 4: Login
        print("Step 4: Logging in as demo_user...")
        response = self.client.post(
            "/api/login/",
            data=json.dumps({
                "username": "demo_user",
                "password": "SecurePass123"
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200, f"Login failed: {response.json()}")
        print(f"   ✓ Login successful")

        # Step 5: Access protected resource (should work now)
        print("Step 5: Accessing inventory after login...")
        response = self.client.get("/api/inventory/")
        self.assertEqual(response.status_code, 200)
        print(f"   ✓ Inventory access granted - Status: 200")

        print("=== AUTH WORKFLOW PASSED ===\n")


class FullInventoryWorkflowTest(TestCase):
    """Simulate complete inventory management workflow."""

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="inventory_mgr",
            password="pass123",
            email="inv@test.com"
        )
        self.client.login(username="inventory_mgr", password="pass123")

    def test_complete_inventory_workflow(self):
        """
        User Journey: Add Item → View List → Edit Item → Move Item → Delete Item
        """
        print("\n=== INVENTORY WORKFLOW TEST ===")

        # Step 1: Add new inventory item
        print("Step 1: Adding new inventory item 'Copper Pipes'...")
        response = self.client.post(
            "/api/inventory/add/",
            data=json.dumps({
                "name": "Copper Pipes",
                "description": "1 inch diameter copper pipes",
                "type": "material",
                "location": "warehouse",
                "quantity": 50,
                "price": 25.99,
                "supplier": "MetalWorks Inc"
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201, f"Add failed: {response.json()}")
        item_id = response.json()["item"]["item_id"]
        print(f"   ✓ Item created with ID: {item_id}")

        # Step 2: Add item WITHOUT description (should work - optional field)
        print("Step 2: Adding item without description (optional field)...")
        response = self.client.post(
            "/api/inventory/add/",
            data=json.dumps({
                "name": "PVC Fittings",
                "type": "material",
                "location": "warehouse",
                "quantity": 100,
                "price": 5.50,
                "supplier": "PlumbSupply Co"
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201, f"Add without desc failed: {response.json()}")
        print(f"   ✓ Item without description created successfully")

        # Step 3: View inventory list
        print("Step 3: Viewing inventory list...")
        response = self.client.get("/api/inventory/")
        self.assertEqual(response.status_code, 200)
        items = response.json()["items"]
        self.assertEqual(len(items), 2)
        print(f"   ✓ Inventory shows {len(items)} items")

        # Step 4: Edit item quantity
        print("Step 4: Editing item quantity (50 → 75)...")
        response = self.client.patch(
            f"/api/inventory/{item_id}/",
            data=json.dumps({"quantity": 75}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["item"]["quantity"], 75)
        print(f"   ✓ Quantity updated to 75")

        # Step 5: Create a jobsite for move operation
        print("Step 5: Creating jobsite 'Downtown Project'...")
        response = self.client.post(
            "/api/jobsites/",
            data=json.dumps({
                "name": "Downtown Project",
                "address": "123 Main St"
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        jobsite_id = response.json()["jobsite"]["jobsite_id"]
        print(f"   ✓ Jobsite created with ID: {jobsite_id}")

        # Step 6: Move item to jobsite
        print("Step 6: Moving item to jobsite...")
        response = self.client.patch(
            f"/api/inventory/{item_id}/reassign/",
            data=json.dumps({
                "location": "jobsite",
                "jobsite_id": jobsite_id
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["item"]["location"], "jobsite")
        print(f"   ✓ Item moved to jobsite")

        # Step 7: Delete item
        print("Step 7: Deleting item...")
        response = self.client.delete(f"/api/inventory/{item_id}/")
        self.assertEqual(response.status_code, 200)
        print(f"   ✓ Item deleted")

        # Verify deletion
        response = self.client.get("/api/inventory/")
        items = response.json()["items"]
        self.assertEqual(len(items), 1)  # Only PVC Fittings remains
        print(f"   ✓ Inventory now shows 1 item")

        print("=== INVENTORY WORKFLOW PASSED ===\n")


class FullRequestWorkflowTest(TestCase):
    """Simulate complete material request workflow including admin actions."""

    def setUp(self):
        self.client = Client()
        # Create admin user
        self.admin = User.objects.create_user(
            username="admin_user",
            password="admin123",
            email="admin@test.com",
            role="admin"
        )
        # Create regular user
        self.worker = User.objects.create_user(
            username="worker_user",
            password="worker123",
            email="worker@test.com",
            role="user"
        )
        # Create inventory item
        self.item = InventoryItem.objects.create(
            name="HVAC Filters",
            description="20x20 air filters",
            type="material",
            location="warehouse",
            quantity=100,
            price=15.00,
            supplier="FilterPro",
            created_by=self.admin
        )

    def test_existing_item_request_workflow(self):
        """
        User Journey: Worker requests existing item → Admin approves → Fulfilled
        """
        print("\n=== EXISTING ITEM REQUEST WORKFLOW ===")

        # Step 1: Worker logs in and creates request
        print("Step 1: Worker creating request for existing item...")
        self.client.login(username="worker_user", password="worker123")
        response = self.client.post(
            "/api/requests/",
            data=json.dumps({
                "item_id": self.item.item_id,
                "quantity_requested": 10
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201, f"Request failed: {response.json()}")
        request_id = response.json()["request"]["request_id"]
        print(f"   ✓ Request created with ID: {request_id}")

        # Step 2: Verify request shows item name
        response = self.client.get("/api/requests/")
        requests = response.json()["requests"]
        self.assertEqual(len(requests), 1)
        self.assertEqual(requests[0]["item_name"], "HVAC Filters")
        print(f"   ✓ Request list shows item name: 'HVAC Filters'")

        # Step 3: Worker logs out, Admin logs in
        print("Step 2: Admin reviewing request...")
        self.client.logout()
        self.client.login(username="admin_user", password="admin123")

        # Step 4: Admin approves request
        print("Step 3: Admin approving request...")
        response = self.client.patch(
            f"/api/requests/{request_id}/",
            data=json.dumps({"status": "approved"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["request"]["status"], "approved")
        print(f"   ✓ Request approved")

        # Step 5: Verify inventory NOT deducted (handled by deliveries)
        self.item.refresh_from_db()
        self.assertEqual(self.item.quantity, 100)
        print(f"   ✓ Inventory NOT deducted on approval (correct - deliveries handle this)")

        # Step 6: Admin marks as fulfilled
        print("Step 4: Admin marking request as fulfilled...")
        response = self.client.patch(
            f"/api/requests/{request_id}/",
            data=json.dumps({"status": "fulfilled"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["request"]["status"], "fulfilled")
        print(f"   ✓ Request fulfilled")

        # Step 7: Verify fulfilled request cannot be changed
        print("Step 5: Verifying fulfilled request is locked...")
        response = self.client.patch(
            f"/api/requests/{request_id}/",
            data=json.dumps({"status": "pending"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        print(f"   ✓ Fulfilled request correctly blocked from changes")

        print("=== EXISTING ITEM REQUEST WORKFLOW PASSED ===\n")

    def test_new_item_request_workflow(self):
        """
        User Journey: Worker requests NEW item (not in inventory) → Admin reviews
        """
        print("\n=== NEW ITEM REQUEST WORKFLOW ===")

        # Step 1: Worker creates request for NEW item
        print("Step 1: Worker requesting NEW item (not in inventory)...")
        self.client.login(username="worker_user", password="worker123")
        response = self.client.post(
            "/api/requests/",
            data=json.dumps({
                "new_item_name": "Refrigerant R-410A",
                "new_item_type": "material",
                "quantity_requested": 5
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201, f"Request failed: {response.json()}")
        request_data = response.json()["request"]
        request_id = request_data["request_id"]
        print(f"   ✓ New item request created with ID: {request_id}")

        # Verify new item fields
        self.assertEqual(request_data["new_item_name"], "Refrigerant R-410A")
        self.assertEqual(request_data["new_item_type"], "material")
        self.assertIsNone(request_data.get("item_id") or request_data.get("item"))
        print(f"   ✓ New item name: 'Refrigerant R-410A'")
        print(f"   ✓ New item type: 'material'")

        # Step 2: Admin can see the new item request
        print("Step 2: Admin viewing new item request...")
        self.client.logout()
        self.client.login(username="admin_user", password="admin123")
        response = self.client.get("/api/requests/")
        requests = response.json()["requests"]
        new_item_request = next(r for r in requests if r["request_id"] == request_id)
        self.assertEqual(new_item_request["new_item_name"], "Refrigerant R-410A")
        print(f"   ✓ Admin can see new item request details")

        # Step 3: Admin approves
        print("Step 3: Admin approving new item request...")
        response = self.client.patch(
            f"/api/requests/{request_id}/",
            data=json.dumps({"status": "approved"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        print(f"   ✓ New item request approved")

        print("=== NEW ITEM REQUEST WORKFLOW PASSED ===\n")

    def test_request_denial_workflow(self):
        """
        User Journey: Worker requests item → Admin denies → Cannot be changed
        """
        print("\n=== REQUEST DENIAL WORKFLOW ===")

        # Create request
        print("Step 1: Worker creating request...")
        self.client.login(username="worker_user", password="worker123")
        response = self.client.post(
            "/api/requests/",
            data=json.dumps({
                "item_id": self.item.item_id,
                "quantity_requested": 999  # Large quantity
            }),
            content_type="application/json",
        )
        request_id = response.json()["request"]["request_id"]
        print(f"   ✓ Request created for 999 units")

        # Admin denies
        print("Step 2: Admin denying request...")
        self.client.logout()
        self.client.login(username="admin_user", password="admin123")
        response = self.client.patch(
            f"/api/requests/{request_id}/",
            data=json.dumps({"status": "denied"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        print(f"   ✓ Request denied")

        # Verify cannot change denied request
        print("Step 3: Verifying denied request is locked...")
        response = self.client.patch(
            f"/api/requests/{request_id}/",
            data=json.dumps({"status": "approved"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        print(f"   ✓ Denied request correctly blocked from changes")

        print("=== REQUEST DENIAL WORKFLOW PASSED ===\n")

    def test_request_cancellation_workflow(self):
        """
        User Journey: Worker requests item → Worker cancels own request
        """
        print("\n=== REQUEST CANCELLATION WORKFLOW ===")

        # Create request
        print("Step 1: Worker creating request...")
        self.client.login(username="worker_user", password="worker123")
        response = self.client.post(
            "/api/requests/",
            data=json.dumps({
                "item_id": self.item.item_id,
                "quantity_requested": 5
            }),
            content_type="application/json",
        )
        request_id = response.json()["request"]["request_id"]
        print(f"   ✓ Request created")

        # Worker cancels own request
        print("Step 2: Worker cancelling own request...")
        response = self.client.patch(
            f"/api/requests/{request_id}/",
            data=json.dumps({"status": "cancelled"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["request"]["status"], "cancelled")
        print(f"   ✓ Request cancelled by worker")

        print("=== REQUEST CANCELLATION WORKFLOW PASSED ===\n")


class FullDeliveryWorkflowTest(TestCase):
    """Simulate complete delivery workflow."""

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="delivery_mgr",
            password="pass123",
            email="delivery@test.com"
        )
        self.client.login(username="delivery_mgr", password="pass123")

    def test_warehouse_delivery_workflow(self):
        """
        User Journey: Create delivery to warehouse → Verify items created/updated
        """
        print("\n=== WAREHOUSE DELIVERY WORKFLOW ===")

        # Step 1: Create delivery with new items
        print("Step 1: Creating delivery to warehouse...")
        response = self.client.post(
            "/api/deliveries/",
            data=json.dumps({
                "supplier": "HVAC Wholesale",
                "location": "warehouse",
                "items": [
                    {"item_name": "Duct Tape", "quantity": 50, "type": "material"},
                    {"item_name": "Wire Nuts", "quantity": 200, "type": "material"}
                ]
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201, f"Delivery failed: {response.json()}")
        delivery_id = response.json()["delivery"]["delivery_id"]
        print(f"   ✓ Delivery created with ID: {delivery_id}")

        # Step 2: Verify inventory was updated
        print("Step 2: Verifying inventory updated...")
        response = self.client.get("/api/inventory/")
        items = response.json()["items"]
        item_names = [i["name"] for i in items]
        self.assertIn("Duct Tape", item_names)
        self.assertIn("Wire Nuts", item_names)
        print(f"   ✓ Inventory contains delivered items")

        # Step 3: View delivery details
        print("Step 3: Viewing delivery details...")
        response = self.client.get(f"/api/deliveries/{delivery_id}/")
        self.assertEqual(response.status_code, 200)
        delivery = response.json()["delivery"]
        self.assertEqual(delivery["supplier"], "HVAC Wholesale")
        self.assertEqual(len(delivery["items"]), 2)
        print(f"   ✓ Delivery details retrieved")

        print("=== WAREHOUSE DELIVERY WORKFLOW PASSED ===\n")

    def test_jobsite_delivery_workflow(self):
        """
        User Journey: Create jobsite → Deliver items directly to jobsite
        """
        print("\n=== JOBSITE DELIVERY WORKFLOW ===")

        # Step 1: Create jobsite
        print("Step 1: Creating jobsite...")
        response = self.client.post(
            "/api/jobsites/",
            data=json.dumps({
                "name": "North Campus Building",
                "address": "456 University Ave"
            }),
            content_type="application/json",
        )
        jobsite_id = response.json()["jobsite"]["jobsite_id"]
        print(f"   ✓ Jobsite created with ID: {jobsite_id}")

        # Step 2: Create delivery to jobsite
        print("Step 2: Creating delivery to jobsite...")
        response = self.client.post(
            "/api/deliveries/",
            data=json.dumps({
                "supplier": "Electric Supply Co",
                "location": "jobsite",
                "jobsite_id": jobsite_id,
                "items": [
                    {"item_name": "Circuit Breakers", "quantity": 10, "type": "equipment"}
                ]
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        print(f"   ✓ Delivery to jobsite created")

        # Step 3: Verify item location is jobsite
        print("Step 3: Verifying item location...")
        response = self.client.get("/api/inventory/")
        items = response.json()["items"]
        circuit_breakers = next(i for i in items if i["name"] == "Circuit Breakers")
        self.assertEqual(circuit_breakers["location"], "jobsite")
        self.assertEqual(circuit_breakers["jobsite_id"], jobsite_id)
        print(f"   ✓ Item correctly assigned to jobsite")

        print("=== JOBSITE DELIVERY WORKFLOW PASSED ===\n")


class AdminPermissionsWorkflowTest(TestCase):
    """Verify admin vs regular user permissions."""

    def setUp(self):
        self.client = Client()
        self.admin = User.objects.create_user(
            username="admin",
            password="admin123",
            email="admin@test.com",
            role="admin"
        )
        self.regular = User.objects.create_user(
            username="regular",
            password="regular123",
            email="regular@test.com",
            role="user"
        )

    def test_admin_permissions_workflow(self):
        """
        Verify: Regular user blocked from admin endpoints, admin user allowed
        """
        print("\n=== ADMIN PERMISSIONS WORKFLOW ===")

        # Step 1: Regular user tries admin endpoint
        print("Step 1: Regular user attempting admin access...")
        self.client.login(username="regular", password="regular123")
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, 403)
        print(f"   ✓ Regular user blocked - Status: 403 Forbidden")

        # Step 2: Admin user accesses same endpoint
        print("Step 2: Admin user accessing admin endpoint...")
        self.client.logout()
        self.client.login(username="admin", password="admin123")
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, 200)
        print(f"   ✓ Admin user allowed - Status: 200 OK")

        # Step 3: Verify admin can see user list
        users = response.json()["users"]
        self.assertEqual(len(users), 2)
        print(f"   ✓ Admin can view {len(users)} users")

        print("=== ADMIN PERMISSIONS WORKFLOW PASSED ===\n")


class EdgeCaseWorkflowTest(TestCase):
    """Test edge cases and error handling."""

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="testuser",
            password="pass123",
            email="test@test.com"
        )
        self.client.login(username="testuser", password="pass123")

    def test_validation_errors_workflow(self):
        """
        Verify proper validation error handling
        """
        print("\n=== VALIDATION ERRORS WORKFLOW ===")

        # Test 1: Negative quantity
        print("Test 1: Attempting negative quantity...")
        response = self.client.post(
            "/api/inventory/add/",
            data=json.dumps({
                "name": "Test Item",
                "type": "material",
                "location": "warehouse",
                "quantity": -5,
                "price": 10.00,
                "supplier": "Test"
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        print(f"   ✓ Negative quantity rejected")

        # Test 2: Invalid item type
        print("Test 2: Attempting invalid item type...")
        response = self.client.post(
            "/api/inventory/add/",
            data=json.dumps({
                "name": "Test Item",
                "type": "invalid_type",
                "location": "warehouse",
                "quantity": 5,
                "price": 10.00,
                "supplier": "Test"
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        print(f"   ✓ Invalid item type rejected")

        # Test 3: Missing required fields
        print("Test 3: Attempting missing required fields...")
        response = self.client.post(
            "/api/inventory/add/",
            data=json.dumps({"name": "Only Name"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        print(f"   ✓ Missing fields rejected")

        # Test 4: Empty delivery items
        print("Test 4: Attempting delivery with no items...")
        response = self.client.post(
            "/api/deliveries/",
            data=json.dumps({
                "supplier": "Test",
                "location": "warehouse",
                "items": []
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        print(f"   ✓ Empty delivery items rejected")

        print("=== VALIDATION ERRORS WORKFLOW PASSED ===\n")

    def test_not_found_workflow(self):
        """
        Verify proper 404 handling for nonexistent resources
        """
        print("\n=== NOT FOUND WORKFLOW ===")

        print("Test 1: Getting nonexistent inventory item...")
        response = self.client.get("/api/inventory/99999/")
        self.assertEqual(response.status_code, 404)
        print(f"   ✓ Nonexistent item returns 404")

        print("Test 2: Getting nonexistent delivery...")
        response = self.client.get("/api/deliveries/99999/")
        self.assertEqual(response.status_code, 404)
        print(f"   ✓ Nonexistent delivery returns 404")

        print("Test 3: Getting nonexistent jobsite...")
        response = self.client.delete("/api/jobsites/99999/")
        self.assertEqual(response.status_code, 404)
        print(f"   ✓ Nonexistent jobsite returns 404")

        print("=== NOT FOUND WORKFLOW PASSED ===\n")
