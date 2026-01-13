import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponseForbidden
import httpx
import ungp_disha_library.auth.user as dishalib_user

User = get_user_model()

class DishaSSOMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # headers = dict(request.headers)
        # try:
        #     with httpx.Client() as client:
        #         resp = client.post(os.getenv("LIB_BACKEND_URL") + "/me", headers=headers)
        #     user_info = resp.json()
        # except Exception as e:
        #     return HttpResponseForbidden(f"SSO token invalide: {e}")

        # username = user_info.get("username")
        # if not username:
        #     return HttpResponseForbidden("SSO token invalide")

        # user, created = User.objects.get_or_create(username=username)
        # user.email = user_info.get("email", "")
        # user.save()

        # request.user = user
        # return self.get_response(request)
        # Si l'utilisateur est déjà authentifié, on ne fait rien
        if hasattr(request, "user") and request.user.is_authenticated:
            return self.get_response(request)

        main_user = dishalib_user.get_main_user(request)

        user, created = User.objects.get_or_create(username=main_user.username)
        user.email = getattr(main_user, "email", "")
        user.first_name = getattr(main_user, "first_name", "")
        user.last_name = getattr(main_user, "last_name", "")
        user.save()

        request.user = user  # authentifie l'utilisateur pour Django
        return self.get_response(request)
