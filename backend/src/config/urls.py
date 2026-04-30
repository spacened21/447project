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
    request_list_create_view,
    request_my_view,
    request_update_view,
    delivery_list_create_view,
    delivery_detail_view,
    admin_users_list_view,
    admin_user_update_view,
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
    path("api/requests/", request_list_create_view),
    path("api/requests/mine/", request_my_view),
    path("api/requests/<int:request_id>/", request_update_view),
    path("api/deliveries/", delivery_list_create_view),
    path("api/deliveries/<int:delivery_id>/", delivery_detail_view),
    path("api/admin/users/", admin_users_list_view),
    path("api/admin/users/<int:user_id>/", admin_user_update_view),
]