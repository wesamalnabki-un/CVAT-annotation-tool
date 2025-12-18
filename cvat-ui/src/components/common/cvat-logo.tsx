// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import CVATLogoImage from 'assets/Final-Logo_white.png';

function CVATLogo(): JSX.Element {
    return (
        <div className='cvat-logo-icon'>
            <img src={CVATLogoImage} alt='DISHA Logo' />
        </div>
    );
}

export default React.memo(CVATLogo);
