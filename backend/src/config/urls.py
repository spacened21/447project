from django.contrib import admin
from django.urls import path
from api.views import register_view, login_view, logout_view, session_view

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/register/", register_view),
    path("api/login/", login_view),
    path("api/logout/", logout_view),
    path("api/session/", session_view),
]