from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from api.views import (
    register_view,
    login_view,
    logout_view,
    session_view,
    inventory_list_view,
    inventory_add_view,
    inventory_delete_view,
    inventory_reassign_view,
    inventory_report_status_view,
    request_list_create_view,
    request_my_view,
    request_update_view,
    delivery_list_create_view,
    delivery_detail_view,
    delivery_packing_slip_upload_view,
    admin_users_list_view,
    admin_user_update_view,
    jobsite_list_create_view,
    jobsite_detail_view,
)

def api_root(request):
    """Root endpoint showing available API endpoints."""
    return JsonResponse({
        "message": "Inventory Management API",
        "status": "running",
        "endpoints": {
            "auth": ["/api/register/", "/api/login/", "/api/logout/", "/api/session/"],
            "inventory": ["/api/inventory/", "/api/inventory/add/"],
            "requests": ["/api/requests/", "/api/requests/mine/"],
            "deliveries": ["/api/deliveries/"],
            "admin": ["/api/admin/users/"],
            "jobsites": ["/api/jobsites/"],
        }
    })


urlpatterns = [
    path("", api_root),  # Root URL handler
    path("admin/", admin.site.urls),
    path("api/register/", register_view),
    path("api/login/", login_view),
    path("api/logout/", logout_view),
    path("api/session/", session_view),
    path("api/inventory/", inventory_list_view),
    path("api/inventory/add/", inventory_add_view),
    path("api/inventory/<int:item_id>/", inventory_delete_view),
    path("api/inventory/<int:item_id>/reassign/", inventory_reassign_view),
    path("api/inventory/<int:item_id>/status/", inventory_report_status_view),
    path("api/requests/", request_list_create_view),
    path("api/requests/mine/", request_my_view),
    path("api/requests/<int:request_id>/", request_update_view),
    path("api/deliveries/", delivery_list_create_view),
    path("api/deliveries/<int:delivery_id>/", delivery_detail_view),
    path("api/deliveries/<int:delivery_id>/packing-slip/", delivery_packing_slip_upload_view),
    path("api/admin/users/", admin_users_list_view),
    path("api/admin/users/<int:user_id>/", admin_user_update_view),
    path("api/jobsites/", jobsite_list_create_view),
    path("api/jobsites/<int:jobsite_id>/", jobsite_detail_view),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)