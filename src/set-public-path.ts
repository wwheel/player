const scriptURL = (document.currentScript as HTMLScriptElement).src;
// @ts-ignore
__webpack_public_path__ = scriptURL.slice(0, scriptURL.lastIndexOf('/') + 1);
// @ts-ignore
console.log('this is webpack startup code, setting public path to:', __webpack_public_path__);
