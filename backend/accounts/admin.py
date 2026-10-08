from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class DekkoUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Factory", {"fields": ("role", "employee_code", "department", "designation", "phone")}),
    )
    list_display = ("username", "first_name", "last_name", "role", "department", "employee_code")
    list_filter = ("role", "department", "is_staff")
