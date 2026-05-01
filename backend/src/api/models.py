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

class Jobsite(models.Model):
    jobsite_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)
    address = models.CharField(max_length=512, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="jobsites_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


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
    jobsite = models.ForeignKey(
        Jobsite,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="items",
    )

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


class Delivery(models.Model):
    delivery_id = models.AutoField(primary_key=True)
    supplier = models.CharField(max_length=255)
    received_by = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="deliveries_received"
    )
    location = models.CharField(max_length=20, choices=InventoryItem.LOCATION_CHOICES, default="warehouse")
    jobsite = models.ForeignKey(
        Jobsite,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deliveries",
    )
    notes = models.TextField(blank=True, default="")
    received_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Delivery #{self.delivery_id} from {self.supplier}"


class DeliveryItem(models.Model):
    delivery = models.ForeignKey(
        Delivery,
        on_delete=models.CASCADE,
        related_name="items"
    )
    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="delivery_items",
        null=True,
        blank=True
    )
    # For new items not yet in inventory
    item_name = models.CharField(max_length=255)
    item_type = models.CharField(max_length=20, choices=InventoryItem.ITEM_TYPES, default="material")
    quantity = models.PositiveIntegerField()
    description = models.TextField(blank=True, default="")

    def __str__(self):
        return f"{self.item_name} x{self.quantity}"


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