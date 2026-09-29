from django.db import connection
from django.http import JsonResponse
from rest_framework import viewsets

from .models import Note
from .serializers import NoteSerializer


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer


def health(request):
    """Returns 200 when the app and database are reachable, 503 otherwise."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception as e:
        print(f"DATABASE HEALTH CHECK ERROR: {e}", flush=True)
        return JsonResponse({"status": "unhealthy", "database": "down"}, status=503)
    return JsonResponse({"status": "ok", "database": "up"})
