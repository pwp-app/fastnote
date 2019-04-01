var Time = {
    //获取当前时间
    getCurrentTime:function() {
        var date = new Date();

        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();

        var h = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();

        if (h<10){
            h="0"+h;
        }
        if (m<10){
            m="0"+m;
        }
        if (s<10){
            s="0"+s;
        }

        return year+'年'+month+'月'+day+'日'+' '+h+':'+m+':'+s;
    },
    getAllTime:function(){
        var date = new Date();

        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();

        var h = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();

        if (day<10){
            day="0"+day;
        }
        if (h<10){
            h="0"+h;
        }
        if (m<10){
            m="0"+m;
        }
        if (s<10){
            s="0"+s;
        }

        var currenttime = year+'年'+month+'月'+day+'日'+' '+h+':'+m+':'+s;

        if (month<10){
            month="0"+month;
        }

        var rawtime = ''+year+month+day+h+m+s;

        var alltime = {
            currentTime:currenttime,
            rawTime:rawtime
        };
        
        return alltime;
    },
    //获取时区
    getTimeZone:function(){
        var timezone = new Date().getTimezoneOffset();
        return timezone / 60;
    },
    //获取未编码的时间
    getRawCurrentTime:function(){
        var date=new Date();
        
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();

        var h = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();

        if (h<10){
            h="0"+h;
        }
        if (m<10){
            m="0"+m;
        }
        if (s<10){
            s="0"+s;
        }
        if (month<10){
            month="0"+month;
        }

        return year+month+day+h+m+s;
    },
    //获取时间戳
    getRawCurrentMillTime:function(){
        var date=new Date();
        
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();

        var h = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();

        if (h<10){
            h="0"+h;
        }
        if (m<10){
            m="0"+m;
        }
        if (s<10){
            s="0"+s;
        }
        if (month<10){
            month="0"+month;
        }

        return year+month+day+h+m+s+date.getMilliseconds();
    }
}

module.exports = Time;