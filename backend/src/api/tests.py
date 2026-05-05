from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from .models import InventoryItem, MaterialRequest, Delivery, Jobsite
import json

User = get_user_model()


class AuthEdgeCaseTests(TestCase):
    """Test authentication edge cases."""

    def setUp(self):
        self.client = Client()

    def test_login_empty_credentials(self):
        """Should reject empty username/password."""
        response = self.client.post(
            "/api/login/",
            data=json.dumps({"username": "", "password": ""}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)  # Invalid credentials = unauthorized

    def test_login_wrong_password(self):
        """Should reject wrong password."""
        User.objects.create_user(username="testuser", password="correct", email="test@test.com")
        response = self.client.post(
            "/api/login/",
            data=json.dumps({"username": "testuser", "password": "wrong"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_login_nonexistent_user(self):
        """Should reject nonexistent user."""
        response = self.client.post(
            "/api/login/",
            data=json.dumps({"username": "nobody", "password": "password"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_register_duplicate_username(self):
        """Should reject duplicate username."""
        User.objects.create_user(username="taken", password="pass", email="first@test.com")
        response = self.client.post(
            "/api/register/",
            data=json.dumps({"username": "taken", "password": "pass", "email": "second@test.com"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("exists", response.json().get("message", "").lower())

    def test_register_always_creates_user_role(self):
        """Registration should always create user role, never admin."""
        response = self.client.post(
            "/api/register/",
            data=json.dumps({
                "username": "hacker",
                "password": "pass123",
                "email": "hacker@test.com",
                "role": "admin"  # Attempt to self-assign admin
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="hacker")
        self.assertEqual(user.role, "user")  # Should be user, not admin


class RequestStatusTransitionTests(TestCase):
    """Test material request status transitions."""

    def setUp(self):
        self.client = Client()
        self.admin = User.objects.create_user(
            username="admin", password="admin123", email="admin@test.com", role="admin"
        )
        self.user = User.objects.create_user(
            username="worker", password="worker123", email="worker@test.com", role="user"
        )
        self.item = InventoryItem.objects.create(
            name="Test Item",
            description="Test",
            type="material",
            location="warehouse",
            quantity=100,
            price=10.00,
            supplier="Test Supplier",
            created_by=self.admin,
        )
        self.request = MaterialRequest.objects.create(
            requester=self.user,
            item=self.item,
            quantity_requested=5,
            status="pending",
        )
        self.client.login(username="admin", password="admin123")

    def test_pending_to_approved(self):
        """Should allow pending -> approved."""
        response = self.client.patch(
            f"/api/requests/{self.request.request_id}/",
            data=json.dumps({"status": "approved"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.request.refresh_from_db()
        self.assertEqual(self.request.status, "approved")

    def test_pending_to_denied(self):
        """Should allow pending -> denied."""
        response = self.client.patch(
            f"/api/requests/{self.request.request_id}/",
            data=json.dumps({"status": "denied"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.request.refresh_from_db()
        self.assertEqual(self.request.status, "denied")

    def test_pending_to_fulfilled_blocked(self):
        """Should NOT allow pending -> fulfilled (must go through approved)."""
        response = self.client.patch(
            f"/api/requests/{self.request.request_id}/",
            data=json.dumps({"status": "fulfilled"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Cannot change status", response.json().get("message", ""))

    def test_approved_to_fulfilled(self):
        """Should allow approved -> fulfilled."""
        self.request.status = "approved"
        self.request.save()

        response = self.client.patch(
            f"/api/requests/{self.request.request_id}/",
            data=json.dumps({"status": "fulfilled"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.request.refresh_from_db()
        self.assertEqual(self.request.status, "fulfilled")

    def test_denied_cannot_change(self):
        """Should NOT allow changes from denied status."""
        self.request.status = "denied"
        self.request.save()

        response = self.client.patch(
            f"/api/requests/{self.request.request_id}/",
            data=json.dumps({"status": "approved"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_fulfilled_cannot_change(self):
        """Should NOT allow changes from fulfilled status."""
        self.request.status = "fulfilled"
        self.request.save()

        response = self.client.patch(
            f"/api/requests/{self.request.request_id}/",
            data=json.dumps({"status": "approved"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_approval_does_not_deduct_inventory(self):
        """Approving a request should NOT deduct from inventory (handled by deliveries)."""
        original_qty = self.item.quantity

        response = self.client.patch(
            f"/api/requests/{self.request.request_id}/",
            data=json.dumps({"status": "approved"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        self.item.refresh_from_db()
        # Inventory should remain unchanged - deduction happens via deliveries
        self.assertEqual(self.item.quantity, original_qty)

    def test_approval_allowed_regardless_of_inventory(self):
        """Approval should succeed even with high quantity (inventory managed separately)."""
        self.request.quantity_requested = 999
        self.request.save()

        response = self.client.patch(
            f"/api/requests/{self.request.request_id}/",
            data=json.dumps({"status": "approved"}),
            content_type="application/json",
        )
        # Approval is allowed - inventory tracking is separate
        self.assertEqual(response.status_code, 200)


class InventoryEdgeCaseTests(TestCase):
    """Test inventory edge cases."""

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="testuser", password="test123", email="test@test.com"
        )
        self.client.login(username="testuser", password="test123")

    def test_add_item_negative_quantity(self):
        """Should reject negative quantity."""
        response = self.client.post(
            "/api/inventory/add/",
            data=json.dumps({
                "name": "Test",
                "description": "Test",
                "type": "material",
                "location": "warehouse",
                "quantity": -5,
                "price": 10.00,
                "supplier": "Test",
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_add_item_negative_price(self):
        """Should reject negative price."""
        response = self.client.post(
            "/api/inventory/add/",
            data=json.dumps({
                "name": "Test",
                "description": "Test",
                "type": "material",
                "location": "warehouse",
                "quantity": 5,
                "price": -10.00,
                "supplier": "Test",
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_add_item_invalid_type(self):
        """Should reject invalid item type."""
        response = self.client.post(
            "/api/inventory/add/",
            data=json.dumps({
                "name": "Test",
                "description": "Test",
                "type": "invalid_type",
                "location": "warehouse",
                "quantity": 5,
                "price": 10.00,
                "supplier": "Test",
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_add_item_invalid_location(self):
        """Should reject invalid location."""
        response = self.client.post(
            "/api/inventory/add/",
            data=json.dumps({
                "name": "Test",
                "description": "Test",
                "type": "material",
                "location": "moon_base",
                "quantity": 5,
                "price": 10.00,
                "supplier": "Test",
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_add_item_missing_required_fields(self):
        """Should reject missing required fields."""
        response = self.client.post(
            "/api/inventory/add/",
            data=json.dumps({"name": "Test"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_delete_nonexistent_item(self):
        """Should return 404 for nonexistent item."""
        response = self.client.delete("/api/inventory/99999/")
        self.assertEqual(response.status_code, 404)

    def test_reassign_to_jobsite_without_jobsite_id(self):
        """Should reject reassigning to jobsite without jobsite_id."""
        item = InventoryItem.objects.create(
            name="Test Item",
            description="Test",
            type="material",
            location="warehouse",
            quantity=10,
            price=10.00,
            supplier="Test",
            created_by=self.user,
        )
        response = self.client.patch(
            f"/api/inventory/{item.item_id}/reassign/",
            data=json.dumps({"location": "jobsite"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("jobsite_id", response.json().get("message", "").lower())


class DeliveryEdgeCaseTests(TestCase):
    """Test delivery edge cases."""

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="testuser", password="test123", email="test@test.com"
        )
        self.client.login(username="testuser", password="test123")

    def test_create_delivery_empty_items(self):
        """Should reject delivery with no items."""
        response = self.client.post(
            "/api/deliveries/",
            data=json.dumps({
                "supplier": "Test Supplier",
                "location": "warehouse",
                "items": [],
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_create_delivery_missing_supplier(self):
        """Should reject delivery without supplier."""
        response = self.client.post(
            "/api/deliveries/",
            data=json.dumps({
                "supplier": "",
                "location": "warehouse",
                "items": [{"item_name": "Test", "quantity": 5}],
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_create_delivery_to_nonexistent_jobsite(self):
        """Should reject delivery to nonexistent jobsite."""
        response = self.client.post(
            "/api/deliveries/",
            data=json.dumps({
                "supplier": "Test",
                "location": "jobsite",
                "jobsite_id": 99999,
                "items": [{"item_name": "Test", "quantity": 5}],
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)  # Jobsite not found

    def test_get_nonexistent_delivery(self):
        """Should return 404 for nonexistent delivery."""
        response = self.client.get("/api/deliveries/99999/")
        self.assertEqual(response.status_code, 404)


class JobsiteEdgeCaseTests(TestCase):
    """Test jobsite edge cases."""

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="testuser", password="test123", email="test@test.com"
        )
        self.client.login(username="testuser", password="test123")

    def test_create_jobsite_empty_name(self):
        """Should reject jobsite with empty name."""
        response = self.client.post(
            "/api/jobsites/",
            data=json.dumps({"name": "", "address": "123 Main St"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_create_duplicate_jobsite_name(self):
        """Should reject duplicate jobsite name."""
        Jobsite.objects.create(name="Existing Site", created_by=self.user)
        response = self.client.post(
            "/api/jobsites/",
            data=json.dumps({"name": "Existing Site"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_delete_nonexistent_jobsite(self):
        """Should return 404 for nonexistent jobsite."""
        response = self.client.delete("/api/jobsites/99999/")
        self.assertEqual(response.status_code, 404)


class UnauthenticatedAccessTests(TestCase):
    """Test that endpoints require authentication."""

    def setUp(self):
        self.client = Client()

    def test_inventory_requires_auth(self):
        """Inventory endpoint should require authentication."""
        response = self.client.get("/api/inventory/")
        self.assertEqual(response.status_code, 401)

    def test_requests_requires_auth(self):
        """Requests endpoint should require authentication."""
        response = self.client.get("/api/requests/")
        self.assertEqual(response.status_code, 401)

    def test_deliveries_requires_auth(self):
        """Deliveries endpoint should require authentication."""
        response = self.client.get("/api/deliveries/")
        self.assertEqual(response.status_code, 401)

    def test_jobsites_requires_auth(self):
        """Jobsites endpoint should require authentication."""
        response = self.client.get("/api/jobsites/")
        self.assertEqual(response.status_code, 401)

    def test_admin_requires_auth(self):
        """Admin endpoint should require authentication."""
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, 401)


class AdminAccessTests(TestCase):
    """Test admin-only access."""

    def setUp(self):
        self.client = Client()
        self.regular_user = User.objects.create_user(
            username="regular", password="pass123", email="regular@test.com", role="user"
        )
        self.admin_user = User.objects.create_user(
            username="admin", password="admin123", email="admin@test.com", role="admin"
        )

    def test_regular_user_cannot_access_admin(self):
        """Regular user should not access admin endpoints."""
        self.client.login(username="regular", password="pass123")
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, 403)

    def test_admin_can_access_admin(self):
        """Admin user should access admin endpoints."""
        self.client.login(username="admin", password="admin123")
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, 200)
