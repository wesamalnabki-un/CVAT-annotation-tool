// Copyright (C) 2020-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux';
import LoginPageComponent from 'components/login-page/login-page';
import { CombinedState } from 'reducers';
import { loginWithCognitoAsync } from 'actions/auth-actions';

interface StateToProps {
    user: any;
    fetching: boolean;
    hasEmailVerificationBeenSent: boolean;
}

interface DispatchToProps {
    onLoginWithCognito: typeof loginWithCognitoAsync;
}

function mapStateToProps(state: CombinedState): StateToProps {
    return {
        user: state.auth.user,
        fetching: state.auth.fetching,
        hasEmailVerificationBeenSent: state.auth.hasEmailVerificationBeenSent,
    };
}

const mapDispatchToProps: DispatchToProps = {
    onLoginWithCognito: loginWithCognitoAsync,
};

export default connect(mapStateToProps, mapDispatchToProps)(LoginPageComponent);
