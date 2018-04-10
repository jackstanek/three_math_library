function setParamsFromDefaults(params, defaults) {
    for (p in defaults) {
        params[p] = params[p] || defaults[p];
    }
}
