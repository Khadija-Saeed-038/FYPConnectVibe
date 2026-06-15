from django.contrib import admin

from .models import Reflection


@admin.register(Reflection)
class ReflectionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "room", "dominant_tone", "created_at")
    list_filter = ("dominant_tone",)
    search_fields = ("user__username", "summary")
    autocomplete_fields = ("user", "room")
    readonly_fields = (
        "summary",
        "sentiment_scores",
        "dominant_tone",
        "created_at",
        "updated_at",
        "deleted_at",
        "created_by",
        "updated_by",
    )
    fieldsets = (
        ("Owner", {"fields": ("user", "room")}),
        ("Analysis", {"fields": ("dominant_tone", "sentiment_scores", "summary")}),
        ("Audit", {"fields": ("created_at", "updated_at", "deleted_at", "created_by", "updated_by")}),
    )
