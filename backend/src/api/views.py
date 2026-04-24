import json
from decimal import Decimal
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout, get_user_model
from .models import InventoryItem, MaterialRequest

User = get_user_model()


@csrf_exempt
def register_view(request):
    if request.method != "POST":
        return JsonResponse({"message": "Only POST allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "Invalid JSON"}, status=400)

    username = data.get("username", "").strip()
    password = data.get("password", "")
    email = data.get("email", "").strip()
    role = data.get("role", "user").strip().lower()

    if not username or not password or not email:
        return JsonResponse(
            {"message": "Username, password, and email are required"},
            status=400,
        )

    if role not in ["user", "admin"]:
        return JsonResponse({"message": "Invalid role"}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"message": "Username already exists"}, status=400)

    if User.objects.filter(email=email).exists():
        return JsonResponse({"message": "Email already exists"}, status=400)

    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        role=role,
    )

    return JsonResponse(
        {
            "success": True,
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
            },
        },
        status=201,
    )


@csrf_exempt
def login_view(request):
    if request.method != "POST":
        return JsonResponse({"message": "Only POST allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "Invalid JSON"}, status=400)

    username = data.get("username", "").strip()
    password = data.get("password", "")

    user = authenticate(request, username=username, password=password)

    if user is None:
        return JsonResponse(
            {"success": False, "message": "Invalid username or password"},
            status=401,
        )

    login(request, user)

    return JsonResponse(
        {
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
            },
        }
    )


def session_view(request):
    if request.user.is_authenticated:
        return JsonResponse(
            {
                "authenticated": True,
                "user": {
                    "id": request.user.id,
                    "username": request.user.username,
                    "email": request.user.email,
                    "role": request.user.role,
                },
            }
        )

    return JsonResponse(
        {
            "authenticated": False,
            "user": None,
        }
    )


@csrf_exempt
def logout_view(request):
    if request.method != "POST":
        return JsonResponse({"message": "Only POST allowed"}, status=405)

    logout(request)
    return JsonResponse({"success": True, "message": "Logged out"})


def inventory_list_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"message": "Login required"}, status=401)

    items = InventoryItem.objects.all().order_by("item_id")

    # Filter by location if provided
    location_filter = request.GET.get("location")
    if location_filter and location_filter in ["warehouse", "yard", "jobsite"]:
        items = items.filter(location=location_filter)

    data = []
    for item in items:
        data.append(
            {
                "item_id": item.item_id,
                "name": item.name,
                "description": item.description,
                "type": item.type,
                "location": item.location,
                "quantity": item.quantity,
                "price": str(item.price),
                "supplier": item.supplier,
                "created_by": item.created_by.username,
            }
        )

    return JsonResponse({"items": data})


@csrf_exempt
def inventory_add_view(request):
    if request.method != "POST":
        return JsonResponse({"message": "Only POST allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"message": "Login required"}, status=401)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "Invalid JSON"}, status=400)

    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    item_type = data.get("type", "").strip().lower()
    location = data.get("location", "warehouse").strip().lower()
    quantity = data.get("quantity")
    price = data.get("price")
    supplier = data.get("supplier", "").strip()

    if not name or not description or not supplier:
        return JsonResponse(
            {"message": "Name, description, and supplier are required"},
            status=400,
        )

    if item_type not in ["material", "equipment"]:
        return JsonResponse(
            {"message": "Type must be 'material' or 'equipment'"},
            status=400,
        )

    if location not in ["warehouse", "yard", "jobsite"]:
        return JsonResponse(
            {"message": "Location must be 'warehouse', 'yard', or 'jobsite'"},
            status=400,
        )

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return JsonResponse({"message": "Quantity must be an integer"}, status=400)

    if quantity < 0:
        return JsonResponse({"message": "Quantity cannot be negative"}, status=400)

    try:
        price = Decimal(str(price))
    except Exception:
        return JsonResponse({"message": "Price must be a number"}, status=400)

    if price < 0:
        return JsonResponse({"message": "Price cannot be negative"}, status=400)

    item = InventoryItem.objects.create(
        name=name,
        description=description,
        type=item_type,
        location=location,
        quantity=quantity,
        price=price,
        supplier=supplier,
        created_by=request.user,
    )

    return JsonResponse(
        {
            "success": True,
            "message": "Item added successfully",
            "item": {
                "item_id": item.item_id,
                "name": item.name,
                "description": item.description,
                "type": item.type,
                "location": item.location,
                "quantity": item.quantity,
                "price": str(item.price),
                "supplier": item.supplier,
                "created_by": item.created_by.username,
            },
        },
        status=201,
    )


@csrf_exempt
def inventory_delete_view(request, item_id):
    if request.method != "DELETE":
        return JsonResponse({"message": "Only DELETE allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"message": "Login required"}, status=401)

    try:
        item = InventoryItem.objects.get(item_id=item_id)
    except InventoryItem.DoesNotExist:
        return JsonResponse({"message": "Item not found"}, status=404)

    item.delete()

    return JsonResponse({"success": True, "message": "Item deleted"})


@csrf_exempt
def seed_inventory_view(request):
    if request.method != "POST":
        return JsonResponse({"message": "Only POST allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"message": "Login required"}, status=401)

    if InventoryItem.objects.exists():
        return JsonResponse(
            {"message": "Inventory already has data"},
            status=400,
        )

    test_items = [
        {
            "name": "Copper Pipe",
            "description": "3/4 inch copper plumbing pipe",
            "type": "material",
            "location": "warehouse",
            "quantity": 120,
            "price": Decimal("14.99"),
            "supplier": "Home Supply Co",
        },
        {
            "name": "Air Filter",
            "description": "Standard HVAC replacement filter",
            "type": "material",
            "location": "yard",
            "quantity": 75,
            "price": Decimal("9.50"),
            "supplier": "Filter World",
        },
        {
            "name": "Power Drill",
            "description": "Cordless drill for installations",
            "type": "equipment",
            "location": "jobsite",
            "quantity": 8,
            "price": Decimal("129.99"),
            "supplier": "Tool Depot",
        },
        {
            "name": "Thermostat",
            "description": "Programmable smart thermostat",
            "type": "equipment",
            "location": "warehouse",
            "quantity": 15,
            "price": Decimal("89.99"),
            "supplier": "Climate Parts Inc",
        },
    ]

    for item_data in test_items:
        InventoryItem.objects.create(
            name=item_data["name"],
            description=item_data["description"],
            type=item_data["type"],
            location=item_data["location"],
            quantity=item_data["quantity"],
            price=item_data["price"],
            supplier=item_data["supplier"],
            created_by=request.user,
        )

    return JsonResponse({"success": True, "message": "Test inventory created"})


def _serialize_request(req):
    """Helper to serialize a MaterialRequest to dict."""
    return {
        "request_id": req.request_id,
        "requester": req.requester.username,
        "requester_id": req.requester.id,
        "item_id": req.item.item_id,
        "item_name": req.item.name,
        "quantity_requested": req.quantity_requested,
        "status": req.status,
        "notes": req.notes,
        "created_at": req.created_at.isoformat(),
        "updated_at": req.updated_at.isoformat(),
        "reviewed_by": req.reviewed_by.username if req.reviewed_by else None,
    }


@csrf_exempt
def request_list_create_view(request):
    """GET: List all requests (with optional ?status= filter). POST: Create new request."""
    if not request.user.is_authenticated:
        return JsonResponse({"message": "Login required"}, status=401)

    if request.method == "GET":
        requests_qs = MaterialRequest.objects.all().order_by("-created_at")

        status_filter = request.GET.get("status")
        if status_filter and status_filter in ["pending", "approved", "denied", "fulfilled"]:
            requests_qs = requests_qs.filter(status=status_filter)

        data = [_serialize_request(r) for r in requests_qs]
        return JsonResponse({"requests": data})

    elif request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON"}, status=400)

        item_id = data.get("item_id")
        quantity_requested = data.get("quantity_requested")
        notes = data.get("notes", "").strip()

        if not item_id:
            return JsonResponse({"message": "item_id is required"}, status=400)

        try:
            item = InventoryItem.objects.get(item_id=item_id)
        except InventoryItem.DoesNotExist:
            return JsonResponse({"message": "Item not found"}, status=404)

        try:
            quantity_requested = int(quantity_requested)
        except (TypeError, ValueError):
            return JsonResponse({"message": "quantity_requested must be an integer"}, status=400)

        if quantity_requested <= 0:
            return JsonResponse({"message": "quantity_requested must be positive"}, status=400)

        new_request = MaterialRequest.objects.create(
            requester=request.user,
            item=item,
            quantity_requested=quantity_requested,
            notes=notes,
        )

        return JsonResponse(
            {
                "success": True,
                "message": "Request created successfully",
                "request": _serialize_request(new_request),
            },
            status=201,
        )

    return JsonResponse({"message": "Method not allowed"}, status=405)


def request_my_view(request):
    """GET: List only the current user's requests."""
    if not request.user.is_authenticated:
        return JsonResponse({"message": "Login required"}, status=401)

    requests_qs = MaterialRequest.objects.filter(requester=request.user).order_by("-created_at")
    data = [_serialize_request(r) for r in requests_qs]
    return JsonResponse({"requests": data})


@csrf_exempt
def request_update_view(request, request_id):
    """PATCH: Update request status (approve/deny/fulfill). Deducts inventory on approval."""
    if request.method != "PATCH":
        return JsonResponse({"message": "Only PATCH allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"message": "Login required"}, status=401)

    try:
        mat_request = MaterialRequest.objects.get(request_id=request_id)
    except MaterialRequest.DoesNotExist:
        return JsonResponse({"message": "Request not found"}, status=404)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "Invalid JSON"}, status=400)

    new_status = data.get("status", "").strip().lower()

    if new_status not in ["approved", "denied", "fulfilled"]:
        return JsonResponse(
            {"message": "Status must be 'approved', 'denied', or 'fulfilled'"},
            status=400,
        )

    # On approval, deduct from inventory if there's enough quantity
    if new_status == "approved" and mat_request.status == "pending":
        item = mat_request.item
        if item.quantity < mat_request.quantity_requested:
            return JsonResponse(
                {"message": f"Insufficient inventory. Available: {item.quantity}"},
                status=400,
            )
        item.quantity -= mat_request.quantity_requested
        item.save()

    mat_request.status = new_status
    mat_request.reviewed_by = request.user
    mat_request.save()

    return JsonResponse(
        {
            "success": True,
            "message": f"Request {new_status}",
            "request": _serialize_request(mat_request),
        }
    )