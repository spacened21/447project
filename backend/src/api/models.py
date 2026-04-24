from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ("user", "User"),
        ("admin", "Admin"),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="user")

    def __str__(self):
        return self.username

class InventoryItem(models.Model):
    ITEM_TYPES = [
        ("material", "Material"),
        ("equipment", "Equipment"),
    ]

    LOCATION_CHOICES = [
        ("warehouse", "Warehouse"),
        ("yard", "Yard"),
        ("jobsite", "Jobsite"),
    ]

    item_id = models.AutoField(primary_key=True)

    name = models.CharField(max_length=255)
    description = models.TextField()

    type = models.CharField(max_length=20, choices=ITEM_TYPES)
    location = models.CharField(max_length=20, choices=LOCATION_CHOICES, default="warehouse")

    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    supplier = models.CharField(max_length=255)

    created_by = models.ForeignKey(
    CustomUser,
    on_delete=models.CASCADE,
    related_name="items"
    )

    def __str__(self):
        return self.name


class MaterialRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("denied", "Denied"),
        ("fulfilled", "Fulfilled"),
    ]

    request_id = models.AutoField(primary_key=True)
    requester = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="material_requests"
    )
    item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="requests"
    )
    quantity_requested = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_requests"
    )

    def __str__(self):
        return f"Request #{self.request_id} - {self.item.name}"