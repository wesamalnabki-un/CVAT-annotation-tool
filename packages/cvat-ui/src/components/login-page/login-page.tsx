// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useEffect } from 'react';
import { RouteComponentProps, useHistory, useLocation } from 'react-router';
import { withRouter } from 'react-router-dom';
import { Row, Col } from 'antd/lib/grid';
import Button from 'antd/lib/button';
import Typography from 'antd/lib/typography';

import SigningLayout, { formSizes } from 'components/signing-common/signing-layout';

const { Title, Text } = Typography;

interface LoginPageComponentProps {
    user: any;
    fetching: boolean;
    hasEmailVerificationBeenSent: boolean;
    onLoginWithCognito: (code: string, callbackUrl: string) => void;
}

function LoginPageComponent(props: LoginPageComponentProps & RouteComponentProps): JSX.Element {
    const history = useHistory();
    const location = useLocation();
    const {
        user, fetching, hasEmailVerificationBeenSent, onLoginWithCognito,
    } = props;

    // Track if we have already attempted a redirect in this session
    const redirectAttempted = React.useRef(false);

    // Handle incoming auth code from Cognito redirect
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        if (code && !fetching && !user) {
            console.log('Found auth code, processing login...', code);
            const callbackUrl = window.location.origin + window.location.pathname;
            onLoginWithCognito(code, callbackUrl);
            // Don't clear the URL immediately to prevent the "no code" logic from triggering
            // before the "fetching" state propagates from Redux.
        }
    }, [location.search, fetching, user]);

    // Automatically redirect to Cognito if we are on the login page and not logged in
    useEffect(() => {
        // If we are logged in, fetching, or already tried to redirect, do nothing
        if (user || fetching || redirectAttempted.current) {
            return;
        }

        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const error = params.get('error');

        // Check if we just logged out using a flag in localStorage
        const logoutInProgress = localStorage.getItem('logoutInProgress');
        if (logoutInProgress === 'true') {
            console.log('Skipping auto-redirect because a logout just occurred.');
            localStorage.removeItem('logoutInProgress');
            return;
        }

        // VERY IMPORTANT:
        // If we have a code or error, it means we just came back from Cognito.
        // In both cases, DO NOT redirect again.
        if (code || error) {
            return;
        }

        console.log('No auth code found and not logged in. Redirecting to Cognito SSO...');
        redirectAttempted.current = true;
        handleSSOLogin();
    }, [location.search, fetching, user]);

    if (hasEmailVerificationBeenSent) {
        history.push('/auth/email-verification-sent');
    }

    const handleSSOLogin = (): void => {
        const COGNITO_DOMAIN = process.env.REACT_APP_COGNITO_DOMAIN;
        const CLIENT_ID = process.env.REACT_APP_COGNITO_APP_ID;
        const REDIRECT_URI = window.location.origin + '/auth/login';

        if (!COGNITO_DOMAIN || !CLIENT_ID) {
            console.error('Cognito configuration is missing', { COGNITO_DOMAIN, CLIENT_ID });
            return;
        }

        // Removed identity_provider=Google to allow any Cognito login method
        const authUrl = `${COGNITO_DOMAIN}/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

        console.log('Redirecting to SSO:', authUrl);
        window.location.href = authUrl;
    };

    return (
        <SigningLayout>
            <Col {...formSizes.wrapper}>
                <Row justify='center'>
                    <Col {...formSizes.form} style={{ textAlign: 'center' }}>
                        <Title level={2}>Welcome to CVAT</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                            Please wait while we redirect you to the login page...
                        </Text>
                        <Button
                            className='cvat-login-sso-button'
                            type="primary"
                            size="large"
                            onClick={handleSSOLogin}
                            loading={fetching}
                            block
                            style={{
                                height: '50px',
                                fontSize: '16px',
                                borderRadius: '8px',
                            }}
                        >
                            Sign in with SSO
                        </Button>
                        <Text type="secondary" style={{ display: 'block', marginTop: '24px', fontSize: '12px' }}>
                            Authentication is secured by Amazon Cognito.
                        </Text>
                    </Col>
                </Row>
            </Col>
        </SigningLayout>
    );
}

export default withRouter(LoginPageComponent);
