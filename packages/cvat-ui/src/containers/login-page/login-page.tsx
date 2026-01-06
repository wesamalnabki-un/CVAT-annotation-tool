// Copyright (C) 2020-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux';
import LoginPageComponent from 'components/login-page/login-page';
import { CombinedState } from 'reducers';
import { loginWithCognitoAsync, loginAsync } from 'actions/auth-actions';

interface StateToProps {
    user: any;
    fetching: boolean;
    hasEmailVerificationBeenSent: boolean;
}

interface DispatchToProps {
    onLoginWithCognito: typeof loginWithCognitoAsync;
    onLogin: (loginData: { credential: string; password: string }) => void;
}

function mapStateToProps(state: CombinedState): StateToProps {
    return {
        user: state.auth.user,
        fetching: state.auth.fetching,
        hasEmailVerificationBeenSent: state.auth.hasEmailVerificationBeenSent,
    };
}

const mapDispatchToProps = (dispatch: any): DispatchToProps => ({
    onLoginWithCognito: (code: string, callbackUrl: string) => dispatch(loginWithCognitoAsync(code, callbackUrl)),
    onLogin: (loginData: { credential: string; password: string }) => dispatch(loginAsync(loginData.credential, loginData.password)),
});

export default connect(mapStateToProps, mapDispatchToProps)(LoginPageComponent);
