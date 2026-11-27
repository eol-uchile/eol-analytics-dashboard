# -*- coding: utf-8 -*-
from django.contrib import admin

from .models import DataFile

@admin.register(DataFile)
class DataFileAdmin(admin.ModelAdmin):
    list_display = ('key', 'file', 'uploaded_at')
    list_filter = ('key',)
