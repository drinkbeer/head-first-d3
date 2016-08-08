$(document).ready(function($){

/**
* Load html
*/
loadHTML = function(html, callback){
    $("#header").load(html, callback);
}
    
/**
* function to load a given css file 
*/ 
loadCSS = function(href) {
    var cssLink = $("<link rel='stylesheet' type='text/css' href='"+href+"'>");
    $("head").append(cssLink); 
};

/**
* function to load a given js file 
*/ 
loadScript = function(src, callback) {
    var script=document.createElement('script'); 
    script.type="text/javascript"; 
    if(script.readyState){
        //IE 
        script.onreadystatechange=function(){ 
            if(script.readyState=="loaded"||script.readyState=="complete"){
                script.onreadystatechange=null; 
                callback(); 
            } 
        }; 
    }else{
        //other browsers 
        script.onload=function(){ 
            callback(); 
        }; 
    } 
    script.src=src;
    document.getElementsByTagName('head')[0].appendChild(script); 
};

/**
* function to load diagram
*/
loadDiagram = function(src) {
    var diagram = $('<script>require(["/scripts/' + src + '"], function () {})</script>');
    $("body").append(diagram); 
};

// load jQuery first
loadScript('https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js',function(){
    loadHTML("/views/header.html", function(){
        $(".nav li").removeClass("active");
        $("a[href*=\"" + pathname + ".html" + "\"]").parent().addClass("active");
    });
    
    // load the css file 
    loadCSS("/css/main.css");
    loadCSS("/css/nav.css");
    loadCSS("/css/bootstrap.min.css");
    loadCSS("/css/bootstrap-theme.min.css");
    loadCSS("https://code.jquery.com/ui/1.11.1/themes/smoothness/jquery-ui.css");
    loadCSS("/css/font-awesome.min.css");

    // load the js file 
    loadScript("/ext-scripts/bootstrap.min.js",function(){});
    var pathname = window.location.pathname; // Returns path
    pathname = pathname.substring(pathname.lastIndexOf("/") + 1, pathname.lastIndexOf("."));
    if(pathname != "index"){
        loadDiagram(pathname + ".js");
    }

});

});