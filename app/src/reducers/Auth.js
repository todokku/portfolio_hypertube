const data = {
    isLogin: false
};

const reducer = (state = data, action) => {
    switch (action.type) {
        case 'AUTH_ISLOGIN':
            return Object.assign({}, state, {
                isLogin: !data.isLogin
            });
        default:
            return state;
    }
};

export default reducer;