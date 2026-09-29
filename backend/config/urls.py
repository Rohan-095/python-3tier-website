from django.urls import include, path

from notes.views import health

urlpatterns = [
    path("health/", health),
    path("api/", include("notes.urls")),
]
