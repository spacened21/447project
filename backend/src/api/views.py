import json
from decimal import Decimal
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout, get_user_model
from .models import InventoryItem

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

    data = []
    for item in items:
        data.append(
            {
                "item_id": item.item_id,
                "name": item.name,
                "description": item.description,
                "type": item.type,
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
            "quantity": 120,
            "price": Decimal("14.99"),
            "supplier": "Home Supply Co",
        },
        {
            "name": "Air Filter",
            "description": "Standard HVAC replacement filter",
            "type": "material",
            "quantity": 75,
            "price": Decimal("9.50"),
            "supplier": "Filter World",
        },
        {
            "name": "Power Drill",
            "description": "Cordless drill for installations",
            "type": "equipment",
            "quantity": 8,
            "price": Decimal("129.99"),
            "supplier": "Tool Depot",
        },
        {
            "name": "Thermostat",
            "description": "Programmable smart thermostat",
            "type": "equipment",
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
            quantity=item_data["quantity"],
            price=item_data["price"],
            supplier=item_data["supplier"],
            created_by=request.user,
        )

    return JsonResponse({"success": True, "message": "Test inventory created"})