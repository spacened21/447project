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

    item_id = models.AutoField(primary_key=True)

    name = models.CharField(max_length=255)
    description = models.TextField()

    type = models.CharField(
    max_length=20,
    choices=ITEM_TYPES
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