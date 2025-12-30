// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import Spin from 'antd/lib/spin';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router';

import { saveLogsAsync } from 'actions/annotation-actions';
import { logoutAsync } from 'actions/auth-actions';

function LogoutComponent(): JSX.Element {
    const dispatch = useDispatch();
    const history = useHistory();

    useEffect(() => {
        dispatch(saveLogsAsync()).then(() => {
            dispatch(logoutAsync()).then(() => {
                const COGNITO_DOMAIN = process.env.REACT_APP_COGNITO_DOMAIN;
                const CLIENT_ID = process.env.REACT_APP_COGNITO_APP_ID;
                const LOGOUT_URI = window.location.origin + '/auth/login';

                // Set a flag in localStorage to tell the login page NOT to auto-redirect
                localStorage.setItem('logoutInProgress', 'true');

                if (COGNITO_DOMAIN && CLIENT_ID) {
                    // Cognito often throws "Missing redirect_uri" because it defaults to a re-login flow on /logout
                    // if it doesn't like the logout_uri or configuration.
                    // Using redirect_uri with response_type=code is more robust for some Cognito setups.
                    const logoutUrl = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(LOGOUT_URI)}`;
                    console.log('Redirecting to Cognito logout:', logoutUrl);
                    window.location.href = logoutUrl;
                } else {
                    history.push('/auth/login');
                }
            });
        });
    }, []);

    return (
        <div className='cvat-logout-page cvat-spinner-container'>
            <Spin className='cvat-spinner' />
        </div>
    );
}

export default React.memo(LogoutComponent);
