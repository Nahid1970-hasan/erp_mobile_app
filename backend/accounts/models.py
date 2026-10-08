from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        MANAGER = "manager", "Manager"
        MERCHANDISER = "merchandiser", "Merchandiser"
        SUPERVISOR = "supervisor", "Supervisor"
        STORE = "store", "Store"
        EMPLOYEE = "employee", "Employee"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EMPLOYEE)
    employee_code = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=80, blank=True)
    designation = models.CharField(max_length=80, blank=True)
    phone = models.CharField(max_length=24, blank=True)

    def __str__(self):
        return self.get_full_name() or self.username
