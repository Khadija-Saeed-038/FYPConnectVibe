from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "recipient", "kind", "message", "is_read", "created_at")
    list_filter = ("kind", "is_read")
    search_fields = ("recipient__username", "message")
    autocomplete_fields = ("recipient",)
    readonly_fields = ("created_at", "updated_at", "deleted_at", "created_by", "updated_by")
    actions = ["mark_read", "mark_unread"]

    @admin.action(description="Mark selected notifications as read")
    def mark_read(self, request, queryset):
        queryset.update(is_read=True)

    @admin.action(description="Mark selected notifications as unread")
    def mark_unread(self, request, queryset):
        queryset.update(is_read=False)
