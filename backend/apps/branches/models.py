from django.db import models

class Branch(models.Model):
    code = models.SlugField(max_length=30, unique=True)
    name = models.CharField(max_length=120)
    address = models.TextField(blank=True)
    phone_number = models.CharField(max_length=25, blank=True)
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.code})"
