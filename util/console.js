/*****************************************
 * Enable using of window.location.origin 
 *****************************************/
if ( ! window.location.origin) window.location.origin = window.location.protocol+"//"+window.location.host+":" + window.location.port +"/";

/****************************************************************
 * Avoid having IE break everything for having used console.log
 ****************************************************************/

var alertFallback = false;
if (typeof console === "undefined" || typeof console.log === "undefined" || typeof console.info === "undefined" ) {
 console = {};
 if (alertFallback) {
     console.log = function(msg) {
          alert(msg);
     };
     console.info = function(msg) {
     	 alert(msg);
     };
 } else {
     console.log = function() {};
 }
}