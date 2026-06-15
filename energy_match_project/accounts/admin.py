from django.contrib import admin

from .models import Interest, UserProfile


@admin.register(Interest)
class InterestAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at", "updated_at", "is_deleted")
    search_fields = ("name",)
    ordering = ("name",)
    readonly_fields = ("created_at", "updated_at", "deleted_at", "created_by", "updated_by")

    @admin.display(boolean=True, description="Deleted")
    def is_deleted(self, obj):
        return obj.deleted_at is not None


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "mood", "availability", "interest_count", "updated_at")
    list_filter = ("mood", "availability")
    search_fields = ("user__username", "user__email", "bio")
    autocomplete_fields = ("user",)
    filter_horizontal = ("interests",)
    readonly_fields = ("created_at", "updated_at", "deleted_at", "created_by", "updated_by")
    fieldsets = (
        ("User", {"fields": ("user", "bio")}),
        ("Energy", {"fields": ("mood", "availability", "interests")}),
        ("Audit", {"fields": ("created_at", "updated_at", "deleted_at", "created_by", "updated_by")}),
    )

    @admin.display(description="Interests")
    def interest_count(self, obj):
        return obj.interests.count()
