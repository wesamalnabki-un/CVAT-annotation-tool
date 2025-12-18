from allauth.socialaccount.providers.amazon_cognito.views import AmazonCognitoOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings

class CognitoLogin(SocialLoginView):
    adapter_class = AmazonCognitoOAuth2Adapter
    client_class = OAuth2Client

    @property
    def callback_url(self):
        # Must match the URL registered in Cognito exactly
        return settings.CVAT_BASE_URL + "/auth/login"
