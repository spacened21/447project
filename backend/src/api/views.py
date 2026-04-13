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