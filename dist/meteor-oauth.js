'use strict';Object.defineProperty(exports,"__esModule",{value:true});var _extends=Object.assign||function(target){for(var i=1;i<arguments.length;i++){var source=arguments[i];for(var key in source){if(Object.prototype.hasOwnProperty.call(source,key)){target[key]=source[key];}}}return target;};var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _react=require('react');var _react2=_interopRequireDefault(_react);
var _reactNative=require('react-native');
var _cheerio=require('cheerio');var _cheerio2=_interopRequireDefault(_cheerio);
var _qs=require('qs');var _qs2=_interopRequireDefault(_qs);
var _randomatic=require('randomatic');var _randomatic2=_interopRequireDefault(_randomatic);
var _base=require('base-64');var _base2=_interopRequireDefault(_base);
var _reactNativeMeteor=require('react-native-meteor');var _reactNativeMeteor2=_interopRequireDefault(_reactNativeMeteor);

var _providerConfigs=require('../provider-configs');var _providerConfigs2=_interopRequireDefault(_providerConfigs);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}

var styles={
buttonContainer:{flexDirection:'row',justifyContent:'space-around'},
button:{flex:-1},
buttonLogin:{backgroundColor:'#bbb'},
buttonLogout:{backgroundColor:'#bbb'},
buttonLoginText:{textAlign:'center',paddingVertical:12,paddingHorizontal:40},
buttonLogoutText:{textAlign:'center',paddingVertical:12,paddingHorizontal:40},
text:{textAlign:'center',marginBottom:15},
view:{flex:1,alignSelf:'stretch',justifyContent:'center'}};var


Login=function(_React$Component){_inherits(Login,_React$Component);






















function Login(props){_classCallCheck(this,Login);var _this=_possibleConstructorReturn(this,(Login.__proto__||Object.getPrototypeOf(Login)).call(this,
props));_this.state={stage:'initial',targetUrl:''};_this.

















login=function(){
var url=_this.props.url||_this.providerConfig.url;
var randomToken=(0,_randomatic2.default)('*',10);
var state=stateParam('popup',randomToken,_this.props.callbackUrl);

var queryString=_qs2.default.stringify(_extends({
client_id:_this.props.clientId,
redirect_uri:_this.props.callbackUrl,
scope:_this.props.scope||_this.providerConfig.scope,
state:state},
_this.providerConfig.extraRequestParams,_this.props.extraRequestParams));

_this.setState({
targetUrl:url+'?'+queryString,
stage:'webView'});

};_this.

navigation=function(_ref){var url=_ref.url;
var regex=new RegExp('^'+_this.props.callbackUrl+'[?#](.*)$');

var parsedUrl=regex.exec(url);
if(parsedUrl){
_this.setState({targetUrl:null});
setTimeout(function(){
_this.setState({stage:'confirmation'});
var meteorUri=_this.props.meteorServerProtocol+'://'+_this.props.meteorServerDomain+'/_oauth/'+_this.props.provider.toLowerCase()+'?'+parsedUrl[1];
fetch(meteorUri).
then(function(res){return res.text();}).
then(function(text){
var $=_cheerio2.default.load(text);
var config=JSON.parse($('#config').text());
_reactNativeMeteor2.default._login({oauth:{
credentialToken:config.credentialToken,
credentialSecret:config.credentialSecret}},
function(err,res){
if(err)console.error('Error',err);
_this.setState({stage:'initial'});
});
}).
catch(function(err){
console.error('Error',err);
_this.setState({stage:'initial'});
});
},500);
}
};_this.

renderStage=function(stage,user){
if(user){
return _react2.default.createElement(_reactNative.View,{style:_this.styles.view},
_react2.default.createElement(_reactNative.Text,{style:_this.styles.text},'Logged in as ',user.profile.name,'.'),
_react2.default.createElement(_reactNative.View,{style:_this.styles.buttonContainer},
_react2.default.createElement(_reactNative.TouchableOpacity,{onPress:function onPress(){return _reactNativeMeteor2.default.logout();},style:_this.styles.buttonLogout},
_react2.default.createElement(_reactNative.Text,{style:_this.styles.buttonLogoutText},'Logout'))));



}

return{
initial:
_react2.default.createElement(_reactNative.View,{style:_this.styles.buttonContainer},
_react2.default.createElement(_reactNative.TouchableOpacity,{onPress:_this.login,style:_this.styles.buttonLogin},
_react2.default.createElement(_reactNative.Text,{style:_this.styles.buttonLoginText},'Login with ',_this.props.provider))),



webView:
_react2.default.createElement(_reactNative.Modal,{
animationType:'fade',
onRequestClose:function onRequestClose(){return _this.setState({stage:'initial'});},
visible:!!_this.state.targetUrl},

_react2.default.createElement(_reactNative.WebView,{
source:{uri:_this.state.targetUrl},
onNavigationStateChange:_this.navigation})),




confirmation:_react2.default.createElement(_reactNative.ActivityIndicator,{animating:true,size:'large'})}[
stage];
};_this.providerConfig=_providerConfigs2.default[_this.props.provider]||{};var propStyles=_this.props.styles||{};_this.styles={buttonContainer:_extends({},styles.buttonContainer,propStyles.buttonContainer),buttonLogin:_extends({},styles.button,styles.buttonLogin,_this.providerConfig.styles.buttonLogin,propStyles.buttonLogin),buttonLogout:_extends({},styles.button,styles.buttonLogout,_this.providerConfig.styles.buttonLogout,propStyles.buttonLogout),buttonLoginText:_extends({},styles.buttonLoginText,_this.providerConfig.styles.buttonLoginText,propStyles.buttonLoginText),buttonLogoutText:_extends({},styles.buttonLogoutText,_this.providerConfig.styles.buttonLogoutText,propStyles.buttonLogoutText),text:_extends({},styles.text,propStyles.text),view:_extends({},styles.view,propStyles.view)};return _this;}_createClass(Login,[{key:'render',value:function render()

{
return(
_react2.default.createElement(_reactNative.View,{style:this.styles.view},
this.renderStage(this.state.stage,this.props.user)));


}}]);return Login;}(_react2.default.Component);Login.propTypes={provider:_react2.default.PropTypes.string.isRequired,callbackUrl:_react2.default.PropTypes.string.isRequired,meteorServerDomain:_react2.default.PropTypes.string.isRequired,meteorServerProtocol:_react2.default.PropTypes.string.isRequired,clientId:_react2.default.PropTypes.string.isRequired,scope:_react2.default.PropTypes.string,url:_react2.default.PropTypes.string,extraRequestParams:_react2.default.PropTypes.string,styles:_react2.default.PropTypes.object};Login.defaultProps={styles:{},classNames:{}};


function stateParam(loginStyle,credentialToken,redirectUrl){
var state={
loginStyle:loginStyle,
credentialToken:credentialToken};

if(loginStyle==='redirect')state.redirectUrl=redirectUrl||null;
return _base2.default.encode(JSON.stringify(state));
}exports.default=

(0,_reactNativeMeteor.createContainer)(function(params){
return{
user:_reactNativeMeteor2.default.user()};

},Login);
//# sourceMappingURL=meteor-oauth.js.map