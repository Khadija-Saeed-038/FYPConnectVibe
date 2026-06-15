from django.contrib import admin

from .models import ChatRoom, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    fields = ("sender", "content", "created_at")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("sender",)


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ("id", "participant_list", "message_count", "created_at")
    search_fields = ("participants__username",)
    filter_horizontal = ("participants",)
    inlines = [MessageInline]
    readonly_fields = ("created_at", "updated_at", "deleted_at", "created_by", "updated_by")

    @admin.display(description="Participants")
    def participant_list(self, obj):
        return ", ".join(obj.participants.values_list("username", flat=True))

    @admin.display(description="Messages")
    def message_count(self, obj):
        return obj.messages.count()


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "room", "sender", "short_content", "created_at")
    list_filter = ("room",)
    search_fields = ("content", "sender__username")
    autocomplete_fields = ("room", "sender")
    readonly_fields = ("created_at", "updated_at", "deleted_at", "created_by", "updated_by")

    @admin.display(description="Content")
    def short_content(self, obj):
        return obj.content[:60] + ("…" if len(obj.content) > 60 else "")
