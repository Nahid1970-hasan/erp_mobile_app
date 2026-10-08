from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "Dekko Isho ERP"
admin.site.site_title = "Dekko Isho"
admin.site.index_title = "Garments operations"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("operations.urls")),
]
