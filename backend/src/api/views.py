from django.shortcuts import render
import json
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt  # okay for local development; replace with proper CSRF handling later
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
        return JsonResponse({"success": False, "message": "Invalid username or password"}, status=401)

    login(request, user)
    return JsonResponse({
        "success": True,
        "message": "Login successful",
        "username": user.username
    })


def session_view(request):
    if request.user.is_authenticated:
        return JsonResponse({
            "authenticated": True,
            "username": request.user.username
        })

    return JsonResponse({"authenticated": False}, status=401)


@csrf_exempt
def logout_view(request):
    if request.method != "POST":
        return JsonResponse({"message": "Only POST allowed"}, status=405)

    logout(request)
    return JsonResponse({"success": True, "message": "Logged out"})
# Create your views here.
