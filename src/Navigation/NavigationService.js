let _navigator;
function setTopLevelNavigator(navigationRef) {
    _navigator = navigationRef
}

function navigate(route, param) {
    _navigator?.navigate(route, param)
}

function getCurrentRoute() {
    return _navigator?.getCurrentRoute?.()
}

export default { setTopLevelNavigator, navigate, getCurrentRoute }