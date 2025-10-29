from django.contrib.auth import get_user_model
from django.utils.functional import SimpleLazyObject
from django.contrib.auth.models import AnonymousUser

User = get_user_model()

class UserRefreshMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Store the original user instance
        original_user = getattr(request, '_cached_user', None)
        
        if original_user and not isinstance(original_user, AnonymousUser):
            # Refresh user from database to ensure we have latest data
            try:
                request._cached_user = User.objects.get(pk=original_user.pk)
            except User.DoesNotExist:
                pass

        response = self.get_response(request)
        return response