from django.contrib import admin
from django.urls import path
from api.views import (
    register_view,
    login_view,
    logout_view,
    session_view,
    inventory_list_view,
    inventory_add_view,
    inventory_delete_view,
    seed_inventory_view,
    request_list_create_view,
    request_my_view,
    request_update_view,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/register/", register_view),
    path("api/login/", login_view),
    path("api/logout/", logout_view),
    path("api/session/", session_view),
    path("api/inventory/", inventory_list_view),
    path("api/inventory/add/", inventory_add_view),
    path("api/inventory/<int:item_id>/", inventory_delete_view),
    path("api/inventory/seed/", seed_inventory_view),
    path("api/requests/", request_list_create_view),
    path("api/requests/mine/", request_my_view),
    path("api/requests/<int:request_id>/", request_update_view),
]