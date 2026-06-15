let _navigator;
function setTopLevelNavigator(navigationRef) {
    _navigator = navigationRef
}

function navigate(route, param) {
    _navigator?.navigate(route, param)
}

export default { setTopLevelNavigator, navigate }