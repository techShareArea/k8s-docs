(function (global, factory) {
    'use strict';

    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory(global, !!global.document);
    } else {
        factory(global);
    }

    // Pass this if window is not defined yet
})(typeof window !== 'undefined' ? window : this, function (window, noGlobal) {
    var site = {
        xxx: {
            name: 'xxx',
            title: 'xxx',
            short_title: 'xxx',
//            protocol: 'http',
            host: 'dev-xxx.ecaicn.com',
            port: 80,
            api: 'dev-xxx-api.ecaicn.com',
            needLogin: true
        },
    }

    if (!noGlobal) {
        window.site = site;
    }

    return site;
});
