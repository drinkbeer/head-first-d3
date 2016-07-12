//http://www.lai18.com/content/902652.html
//http://www.cnblogs.com/JoannaQ/p/3362588.html
// 加载模块的标准方式
require(['d3.min','survey_data'], function (d3,data) {
    //foo is now loaded.
    console.log("hello, d3")
});

// 定义模块的标准方式
define(['d3.min','survey_data'], function(m1, m2) {
    return {
        method: function() {
            m1.methodA();
            m2.methodB();
        }
    };
});

// 如果我们需要加载的或者定义的模块比较少，这种标准的写法是很清晰的。但是如果我们需要加载的模块很多，那么这种一一对应的写法很繁琐。
//下面这样可以的
//define(
//    function (require) {
//        var d3 = require('d3.min'),
//            data = require('survey_data');
//    }
//);

//或者
//define(['require', 'd3.min','survey_data'], function (require) {
//    var d3 = require('d3.min'),
//        var    data = require('survey_data');
//});